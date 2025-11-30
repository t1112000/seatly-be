import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SeatModel } from 'src/models';
import { SeatRepository } from './seat.repository';
import { SeatService } from './seat.service';
import { SeatController } from './seat.controller';
import { SeatProcessor } from './seat.processor';

@Module({
  imports: [SequelizeModule.forFeature([SeatModel])],
  controllers: [SeatController],
  providers: [SeatService, SeatRepository, SeatProcessor],
  exports: [SeatService],
})
export class SeatModule {}
