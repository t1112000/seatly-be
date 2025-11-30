import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentProviderEnum } from 'src/common/enums';
import { PaymentAdapter } from './payment-adapter.interface';
import { StripePaymentAdapter } from './stripe.adapter';
import { MomoPaymentAdapter } from './momo.adapter';

@Injectable()
export class PaymentAdapterFactory {
  private readonly registry: Map<PaymentProviderEnum, PaymentAdapter>;

  constructor(
    private readonly stripeAdapter: StripePaymentAdapter,
    private readonly momoAdapter: MomoPaymentAdapter,
  ) {
    const entries: Array<[PaymentProviderEnum, PaymentAdapter]> = [
      [PaymentProviderEnum.STRIPE, this.stripeAdapter],
      [PaymentProviderEnum.MOMO, this.momoAdapter],
    ];
    this.registry = new Map<PaymentProviderEnum, PaymentAdapter>(entries);
  }

  getAdapter(provider: PaymentProviderEnum): PaymentAdapter {
    const adapter = this.registry.get(provider);
    if (!adapter) {
      throw new BadRequestException(
        `Unsupported payment provider: ${provider}`,
      );
    }
    return adapter;
  }
}
