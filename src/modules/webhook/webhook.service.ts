import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/sequelize';
import { Queue } from 'bullmq';
import { createHmac } from 'crypto';
import { ConfigServiceKeys } from 'src/common/constants';
import {
  BookingStatusEnum,
  PaymentProviderEnum,
  SeatStatusEnum,
} from 'src/common/enums';
import { QueueName } from 'src/common/enums/processor.enum';
import { BookingService } from '../booking/booking.service';
import { SeatService } from '../seat/seat.service';
import { Op, Sequelize } from 'sequelize';
import { SeatModel } from 'src/models';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly bookingService: BookingService,
    private readonly seatService: SeatService,
    private readonly configService: ConfigService,
    @InjectQueue(QueueName.SEAT)
    private readonly seatQueue: Queue,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async handleStripeWebhook(payload: Record<string, any>, signature?: string) {
    const eventId = payload?.id;
    const eventType = payload?.type;
    this.logger.log(
      { eventId, type: eventType, signature },
      'Stripe webhook event received',
    );

    if (!eventType || !payload?.data?.object) {
      this.logger.warn(
        { eventId, type: eventType },
        'Stripe webhook missing required data',
      );
      return true;
    }

    const session = payload.data.object;

    switch (eventType) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(session);
        break;
      case 'checkout.session.expired':
        await this.handleCheckoutExpired(session);
        break;
      default:
        this.logger.debug(
          { eventId, type: eventType },
          'Stripe webhook ignored (unsupported type)',
        );
    }
    return true;
  }

  private async handleCheckoutCompleted(session: Record<string, any>) {
    const sessionId = session?.id;
    if (!sessionId) {
      this.logger.warn('Stripe checkout completed event missing session id');
      return;
    }

    const transaction = await this.sequelize.transaction();

    try {
      const booking = await this.bookingService.findOne(
        {
          provider_session_id: sessionId,
        },
        {
          include: [
            {
              model: SeatModel,
            },
          ],
          transaction,
        },
      );
      if (!booking) {
        this.logger.warn(
          { sessionId },
          'No booking matches Stripe checkout session',
        );
        return;
      }
      if (booking.status === BookingStatusEnum.PAID) {
        this.logger.debug(
          { bookingId: booking.id },
          'Booking already marked as paid',
        );
        return;
      }
      await Promise.all([
        this.bookingService.update(
          booking.id,
          {
            status: BookingStatusEnum.PAID,
            payment_provider: PaymentProviderEnum.STRIPE,
            provider_transaction_id:
              session.payment_intent || booking.provider_transaction_id,
          },
          { transaction },
        ),
        this.seatService.updateByCondition(
          {
            id: {
              [Op.in]: booking.seats.map((seat) => seat.id),
            },
          },
          {
            status: SeatStatusEnum.BOOKED,
          },
          { transaction },
        ),
        this.seatQueue.remove(booking.id),
      ]);
      await transaction.commit();
      this.logger.log(
        { bookingId: booking.id, sessionId },
        'Booking marked as paid after Stripe checkout completed',
      );
    } catch (error) {
      await transaction.rollback();
      this.logger.error(
        error,
        'Error marking booking as paid after Stripe checkout completed',
      );
      throw error;
    }
  }

  private async handleCheckoutExpired(session: Record<string, any>) {
    const sessionId = session?.id;
    if (!sessionId) {
      this.logger.warn('Stripe checkout expired event missing session id');
      return;
    }
    const booking = await this.bookingService.findOne({
      provider_session_id: sessionId,
    });
    if (!booking) {
      this.logger.warn(
        { sessionId },
        'No booking matches expired Stripe checkout session',
      );
      return;
    }
    if (booking.status !== BookingStatusEnum.PENDING_PAYMENT) {
      this.logger.debug(
        { bookingId: booking.id, status: booking.status },
        'Expired checkout ignored because booking already finalized',
      );
      return;
    }
    await Promise.all([
      this.bookingService.update(booking.id, {
        status: BookingStatusEnum.EXPIRED,
      }),
      this.seatService.updateByCondition(
        {
          id: {
            [Op.in]: booking.seats.map((seat) => seat.id),
          },
        },
        {
          status: SeatStatusEnum.AVAILABLE,
        },
      ),
      this.seatQueue.remove(booking.id),
    ]);
    this.logger.log(
      { bookingId: booking.id, sessionId },
      'Booking expired because Stripe checkout expired',
    );
  }

  async handleMomoWebhook(payload: Record<string, any>) {
    this.logger.log(
      { orderId: payload?.orderId, resultCode: payload?.resultCode },
      'MoMo webhook event received',
    );

    const secretKey = this.configService.get<string>(
      ConfigServiceKeys.MOMO_SECRET_KEY,
    );
    if (!secretKey) {
      throw new BadRequestException('MoMo secret key is not configured');
    }

    if (!payload?.signature) {
      this.logger.warn('MoMo webhook missing signature');
      return this.momoResponse(1010, 'Missing signature');
    }

    const expectedSignature = this.generateMomoSignature(payload, secretKey);
    if (expectedSignature !== payload.signature) {
      this.logger.warn(
        { orderId: payload?.orderId },
        'MoMo signature mismatch',
      );
      return this.momoResponse(97, 'Signature mismatch');
    }

    if (!payload?.orderId) {
      this.logger.warn('MoMo webhook missing orderId');
      return this.momoResponse(2001, 'Missing orderId');
    }

    const booking = await this.bookingService.findOne({
      provider_session_id: payload.orderId,
    });

    if (!booking) {
      this.logger.warn(
        { orderId: payload.orderId },
        'MoMo webhook cannot find booking',
      );
      return this.momoResponse(0, 'Booking not found but acknowledged');
    }

    if (payload.resultCode === 0) {
      if (booking.status === BookingStatusEnum.PAID) {
        this.logger.debug(
          { bookingId: booking.id },
          'MoMo webhook ignored because booking already paid',
        );
        return this.momoResponse(0, 'Already processed');
      }
      await Promise.all([
        this.bookingService.update(booking.id, {
          status: BookingStatusEnum.PAID,
          payment_provider: PaymentProviderEnum.MOMO,
          provider_transaction_id:
            payload.transId?.toString() || booking.provider_transaction_id,
        }),
        this.seatService.updateByCondition(
          {
            id: {
              [Op.in]: booking.seats.map((seat) => seat.id),
            },
          },
          {
            status: SeatStatusEnum.BOOKED,
          },
        ),
        this.seatQueue.remove(booking.id),
      ]);
      this.logger.log(
        { bookingId: booking.id },
        'Booking marked as paid via MoMo',
      );
      return this.momoResponse(0, 'Success');
    }

    if (booking.status === BookingStatusEnum.PENDING_PAYMENT) {
      await Promise.all([
        this.bookingService.update(booking.id, {
          status: BookingStatusEnum.FAILED,
        }),
        this.seatService.updateByCondition(
          {
            id: {
              [Op.in]: booking.seats.map((seat) => seat.id),
            },
          },
          {
            status: SeatStatusEnum.AVAILABLE,
          },
        ),
        this.seatQueue.remove(booking.id),
      ]);
      this.logger.log(
        { bookingId: booking.id, resultCode: payload.resultCode },
        'Booking marked as failed due to MoMo result code',
      );
    }

    return this.momoResponse(0, 'MoMo event processed');
  }

  private generateMomoSignature(
    payload: Record<string, any>,
    secretKey: string,
  ) {
    const normalize = (value: any) =>
      value === undefined || value === null ? '' : String(value);

    const rawSignature =
      `accessKey=${normalize(payload.accessKey)}` +
      `&amount=${normalize(payload.amount)}` +
      `&extraData=${normalize(payload.extraData)}` +
      `&message=${normalize(payload.message)}` +
      `&orderId=${normalize(payload.orderId)}` +
      `&orderInfo=${normalize(payload.orderInfo)}` +
      `&orderType=${normalize(payload.orderType)}` +
      `&partnerCode=${normalize(payload.partnerCode)}` +
      `&payType=${normalize(payload.payType)}` +
      `&requestId=${normalize(payload.requestId)}` +
      `&responseTime=${normalize(payload.responseTime)}` +
      `&resultCode=${normalize(payload.resultCode)}` +
      `&transId=${normalize(payload.transId)}`;

    return createHmac('sha256', secretKey).update(rawSignature).digest('hex');
  }

  private momoResponse(resultCode: number, message: string) {
    return {
      resultCode,
      message,
    };
  }
}
