import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BookingSeatModel } from 'src/models';
import { BookingSeatRepository } from './booking-seat.repository';
import { BookingSeatService } from './booking-seat.service';

@Module({
  imports: [SequelizeModule.forFeature([BookingSeatModel])],
  providers: [BookingSeatService, BookingSeatRepository],
  exports: [BookingSeatService],
})
export class BookingSeatModule {}

