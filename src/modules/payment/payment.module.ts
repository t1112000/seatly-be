import { Module, forwardRef } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { PaymentService } from './payment.service';
import { PaymentAdapterFactory } from './adapters/payment-adapter.factory';
import { StripePaymentAdapter } from './adapters/stripe.adapter';
import { MomoPaymentAdapter } from './adapters/momo.adapter';

@Module({
  imports: [forwardRef(() => BookingModule)],
  providers: [
    PaymentService,
    PaymentAdapterFactory,
    StripePaymentAdapter,
    MomoPaymentAdapter,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
