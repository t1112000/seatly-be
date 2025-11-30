import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { SeatModule } from '../seat/seat.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [BookingModule, SeatModule],
  controllers: [AdminController],
})
export class AdminModule {}

