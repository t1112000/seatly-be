import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { SeatModule } from '../seat/seat.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [BookingModule, SeatModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}

