import {
  PaymentCurrencyEnum,
  PaymentProviderEnum,
} from 'src/common/enums';

export interface CreatePaymentLinkPayload {
  bookingId: string;
  bookingCode?: string;
  amount: number;
  currency: PaymentCurrencyEnum;
  description?: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
}

export interface CreatePaymentLinkResult {
  provider: PaymentProviderEnum;
  paymentUrl: string;
  providerSessionId?: string;
  providerTransactionId?: string;
  expiresAt?: Date;
  raw: any;
}

export interface PaymentAdapter {
  createPaymentLink(
    payload: CreatePaymentLinkPayload,
  ): Promise<CreatePaymentLinkResult>;
}

