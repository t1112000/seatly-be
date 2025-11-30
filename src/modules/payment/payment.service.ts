import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigServiceKeys } from 'src/common/constants';
import { BookingStatusEnum, PaymentCurrencyEnum } from 'src/common/enums';
import { SeatModel } from 'src/models';
import { BookingService } from '../booking/booking.service';
import { PaymentAdapterFactory } from './adapters/payment-adapter.factory';
import {
  CreatePaymentLinkDto,
  CreatePaymentLinkResponseDto,
} from './payment.dto';

@Injectable()
export class PaymentService {
  private clientUrl: string;
  constructor(
    private readonly bookingService: BookingService,
    private readonly paymentAdapterFactory: PaymentAdapterFactory,
    private readonly configService: ConfigService,
  ) {
    this.clientUrl =
      this.configService.get<string>(ConfigServiceKeys.CLIENT_URL) || '';
  }

  async createPaymentLink(
    userId: string,
    payload: CreatePaymentLinkDto,
  ): Promise<CreatePaymentLinkResponseDto> {
    const booking = await this.bookingService.findOne(
      {
        id: payload.booking_id,
        user_id: userId,
      },
      {
        include: [
          {
            model: SeatModel,
            attributes: ['id', 'seat_number', 'price'],
            through: { attributes: [] },
          },
        ],
      },
    );

    if (!booking) {
      throw new NotFoundException('Booking không tồn tại');
    }

    if (booking.status !== BookingStatusEnum.PENDING_PAYMENT) {
      throw new ConflictException('Đơn hàng đã được xử lý');
    }

    const provider = payload.provider;
    const adapter = this.paymentAdapterFactory.getAdapter(provider);
    const amount = Number(booking.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Số tiền thanh toán không hợp lệ');
    }

    const defaultSuccessUrl = `${this.clientUrl}/payment-result?booking_id=${booking.id}`;
    const defaultCancelUrl = `${this.clientUrl}/payment-result?booking_id=${booking.id}`;

    const currency = PaymentCurrencyEnum.VND;

    const seats = booking.seats || [];
    const seatNumbers = seats.map((s) => s.seat_number).join(', ');
    const seatIds = seats.map((s) => s.id);

    const description = `Thanh toán ${seats.length} ghế: ${seatNumbers}`;

    const adapterResult = await adapter.createPaymentLink({
      bookingId: booking.id,
      bookingCode: seatNumbers,
      amount,
      currency,
      description,
      successUrl: defaultSuccessUrl,
      cancelUrl: defaultCancelUrl,
      userId,
      metadata: {
        bookingId: booking.id,
        seatIds: seatIds.join(','),
        userId,
      },
    });

    await this.bookingService.update(booking.id, {
      payment_provider: adapterResult.provider,
      provider_session_id: adapterResult.providerSessionId,
      provider_transaction_id: adapterResult.providerTransactionId,
      ...(adapterResult.expiresAt && { expires_at: adapterResult.expiresAt }),
    });

    return {
      booking_id: booking.id,
      provider: adapterResult.provider,
      payment_url: adapterResult.paymentUrl,
      provider_session_id: adapterResult.providerSessionId,
      provider_transaction_id: adapterResult.providerTransactionId,
      expires_at: adapterResult.expiresAt,
    };
  }
}
