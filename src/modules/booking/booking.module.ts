import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BookingModel } from 'src/models';
import { BookingRepository } from './booking.repository';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { SeatModule } from '../seat/seat.module';
import { PaymentModule } from '../payment/payment.module';
import { BookingSeatModule } from '../booking-seat/booking-seat.module';

@Module({
  imports: [
    SequelizeModule.forFeature([BookingModel]),
    SeatModule,
    BookingSeatModule,
    forwardRef(() => PaymentModule),
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingRepository],
  exports: [BookingService],
})
export class BookingModule {}
