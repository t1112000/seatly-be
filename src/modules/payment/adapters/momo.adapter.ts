import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { createHmac } from 'crypto';
import { nanoid } from 'nanoid';
import { ConfigService } from '@nestjs/config';
import { ConfigServiceKeys } from 'src/common/constants';
import { PaymentProviderEnum } from 'src/common/enums';
import {
  CreatePaymentLinkPayload,
  CreatePaymentLinkResult,
  PaymentAdapter,
} from './payment-adapter.interface';

@Injectable()
export class MomoPaymentAdapter implements PaymentAdapter {
  private readonly logger = new Logger(MomoPaymentAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async createPaymentLink(
    payload: CreatePaymentLinkPayload,
  ): Promise<CreatePaymentLinkResult> {
    const partnerCode = this.configService.get<string>(
      ConfigServiceKeys.MOMO_PARTNER_CODE,
    );
    const accessKey = this.configService.get<string>(
      ConfigServiceKeys.MOMO_ACCESS_KEY,
    );
    const secretKey = this.configService.get<string>(
      ConfigServiceKeys.MOMO_SECRET_KEY,
    );
    const ipnUrl = this.configService.get<string>(
      ConfigServiceKeys.MOMO_IPN_URL,
    );
    const redirectUrl =
      payload.successUrl ||
      this.configService.get<string>(ConfigServiceKeys.MOMO_REDIRECT_URL);
    const endpoint =
      this.configService.get<string>(ConfigServiceKeys.MOMO_ENDPOINT) ||
      'https://test-payment.momo.vn/v2/gateway/api/create';
    const storeId = this.configService.get<string>(
      ConfigServiceKeys.MOMO_STORE_ID,
    );

    if (!partnerCode || !accessKey || !secretKey || !ipnUrl || !redirectUrl) {
      throw new BadRequestException('MoMo configuration is incomplete');
    }

    const amount = Math.round(payload.amount);
    const orderId = `${payload.bookingId}-${Date.now()}`;
    const requestId = nanoid();
    const requestType = 'payWithMethod';
    const orderInfo =
      payload.description ||
      `Thanh toán vé ${payload.bookingCode || payload.bookingId}`;
    const extraData = payload.metadata
      ? Buffer.from(JSON.stringify(payload.metadata)).toString('base64')
      : '';

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const body: Record<string, any> = {
      partnerCode,
      partnerName: 'MoMo',
      requestType,
      ipnUrl,
      redirectUrl,
      orderId,
      amount,
      lang: 'vi',
      orderInfo,
      requestId,
      extraData,
      signature,
      autoCapture: true,
    };
    if (storeId) {
      body.storeId = storeId;
    }

    try {
      const response = await axios.post(endpoint, body, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = response.data;

      if (data.resultCode !== 0) {
        throw new BadRequestException(data.message || 'MoMo returned an error');
      }

      return {
        provider: PaymentProviderEnum.MOMO,
        paymentUrl: data.payUrl || data.shortLink || data.deeplink,
        providerSessionId: data.orderId,
        providerTransactionId: data.requestId,
        raw: data,
      };
    } catch (error) {
      this.logger.error('MoMo payment link creation failed', error);
      const message =
        error?.response?.data?.message || error?.message || 'MoMo error';
      throw new BadRequestException(message);
    }
  }
}
