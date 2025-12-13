import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ConfigServiceKeys } from 'src/common/constants';
import { PaymentCurrencyEnum, PaymentProviderEnum } from 'src/common/enums';
import {
  CreatePaymentLinkPayload,
  CreatePaymentLinkResult,
  PaymentAdapter,
} from './payment-adapter.interface';

@Injectable()
export class StripePaymentAdapter implements PaymentAdapter {
  private readonly logger = new Logger(StripePaymentAdapter.name);
  private readonly baseUrl = 'https://api.stripe.com/v1';

  constructor(private readonly configService: ConfigService) {}

  async createOrGetCustomer(
    userId: string,
    email: string,
    name?: string,
  ): Promise<string> {
    const secretKey = this.configService.get<string>(
      ConfigServiceKeys.STRIPE_SECRET_KEY,
    );

    if (!secretKey) {
      throw new BadRequestException('Stripe secret key is not configured');
    }

    const formData = new URLSearchParams();
    formData.append('email', email);
    if (name) {
      formData.append('name', name);
    }
    formData.append('metadata[userId]', userId);

    try {
      const response = await axios.post(
        `${this.baseUrl}/customers`,
        formData.toString(),
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      return response.data.id;
    } catch (error) {
      this.logger.error('Stripe customer creation failed', error);
      throw new BadRequestException(
        error?.response?.data?.error?.message ||
          'Failed to create Stripe customer',
      );
    }
  }

  async createPaymentLink(
    payload: CreatePaymentLinkPayload,
  ): Promise<CreatePaymentLinkResult> {
    const secretKey = this.configService.get<string>(
      ConfigServiceKeys.STRIPE_SECRET_KEY,
    );

    if (!secretKey) {
      throw new BadRequestException('Stripe secret key is not configured');
    }

    const formData = new URLSearchParams();
    formData.append('mode', 'payment');
    formData.append('success_url', payload.successUrl);
    formData.append('cancel_url', payload.cancelUrl);
    formData.append(
      'line_items[0][price_data][product_data][name]',
      payload.description ??
        `Seatly booking ${payload.bookingCode || payload.bookingId}`,
    );

    const currency =
      payload.currency === PaymentCurrencyEnum.USD
        ? PaymentCurrencyEnum.USD
        : PaymentCurrencyEnum.VND;
    const amountInMinorUnit =
      currency === PaymentCurrencyEnum.USD
        ? Math.round(payload.amount * 100)
        : Math.round(payload.amount);

    formData.append('line_items[0][price_data][currency]', currency);
    formData.append(
      'line_items[0][price_data][unit_amount]',
      String(amountInMinorUnit),
    );
    formData.append('line_items[0][quantity]', '1');

    if (payload.customerId) {
      formData.append('customer', payload.customerId);
    } else if (payload.customerEmail) {
      formData.append('customer_email', payload.customerEmail);
    }

    if (payload.metadata) {
      Object.entries(payload.metadata).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(`metadata[${key}]`, String(value));
        }
      });
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/checkout/sessions`,
        formData.toString(),
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      const data = response.data;

      return {
        provider: PaymentProviderEnum.STRIPE,
        paymentUrl: data.url,
        providerSessionId: data.id,
        providerTransactionId: data.payment_intent,
        expiresAt: data.expires_at
          ? new Date(data.expires_at * 1000)
          : undefined,
        raw: data,
      };
    } catch (error) {
      this.logger.error('Stripe checkout session creation failed', error);
      throw new BadRequestException(
        error?.response?.data?.error?.message || 'Stripe error',
      );
    }
  }
}
