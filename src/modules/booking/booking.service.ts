import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import {
  FindOptions,
  WhereOptions,
  Sequelize,
  Transaction,
  UpdateOptions,
  CreateOptions,
} from 'sequelize';
import { BookingModel, SeatModel } from 'src/models';
import { SeatService } from '../seat/seat.service';
import {
  CreateBookingRequestDto,
  CreateBookingDto,
  FilterBookingDto,
  UpdateBookingDto,
} from './booking.dto';
import { BookingRepository } from './booking.repository';
import { SeatStatusEnum, BookingStatusEnum } from 'src/common/enums';
import { InjectQueue } from '@nestjs/bullmq';
import { JobInQueue, QueueName } from 'src/common/enums/processor.enum';
import { Queue } from 'bullmq';
import { BookingSeatService } from '../booking-seat/booking-seat.service';

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly seatService: SeatService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    @InjectQueue(QueueName.SEAT)
    private readonly seatQueue: Queue,
    private readonly bookingSeatService: BookingSeatService,
  ) {}

  async findAll(
    payload: FilterBookingDto,
    options?: FindOptions<BookingModel>,
  ) {
    return this.bookingRepository.findAll(payload, options);
  }

  async findById(id: string, options?: FindOptions<BookingModel>) {
    return this.bookingRepository.findById(id, options);
  }

  async findOne(
    condition: WhereOptions<BookingModel>,
    options?: FindOptions<BookingModel>,
  ) {
    return this.bookingRepository.findOne(condition, options);
  }

  async create(
    payload: CreateBookingDto,
    options?: CreateOptions<BookingModel>,
  ) {
    return this.bookingRepository.create(payload, options);
  }

  async update(
    id: string,
    payload: UpdateBookingDto,
    options?: Omit<UpdateOptions<BookingModel>, 'where'>,
  ) {
    return this.bookingRepository.update(id, payload, options);
  }

  async delete(id: string) {
    return this.bookingRepository.delete(id);
  }

  async deleteByCondition(condition: WhereOptions<BookingModel>) {
    return this.bookingRepository.deleteByCondition(condition);
  }

  async bulkUpdate(
    where: WhereOptions<BookingModel>,
    payload: UpdateBookingDto,
  ) {
    return this.bookingRepository.bulkUpdate(where, payload);
  }

  async count(payload: FilterBookingDto) {
    return this.bookingRepository.count(payload);
  }

  async createBookingForUser(userId: string, payload: CreateBookingRequestDto) {
    const transaction: Transaction = await this.sequelize.transaction();
    try {
      const seatIds = payload.seat_ids;
      let totalAmount = 0;
      const seats: SeatModel[] = [];

      // Validate and lock all seats
      for (const seatId of seatIds) {
        const seat = await this.seatService.findById(seatId, false, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!seat) {
          throw new NotFoundException(`Ghế ${seatId} không tồn tại`);
        }

        if (seat.status !== SeatStatusEnum.AVAILABLE) {
          throw new ConflictException(`Ghế ${seat.seat_number} đã bị đặt`);
        }

        const updatedSeat = await this.seatService.updateByCondition(
          { id: seatId },
          {
            status: SeatStatusEnum.LOCKED,
          },
          { transaction },
        );

        if (!updatedSeat) {
          throw new ConflictException(
            `Ghế ${seat.seat_number} đã bị cập nhật bởi người dùng khác`,
          );
        }

        totalAmount += Number(seat.price);
        seats.push(seat);
      }

      // Create one booking for all seats
      const booking = await this.bookingRepository.create(
        {
          user_id: userId,
          amount: totalAmount,
          status: BookingStatusEnum.PENDING_PAYMENT,
        },
        { transaction },
      );

      // Create booking_seats relationships
      for (const seat of seats) {
        await this.bookingSeatService.create(
          {
            booking_id: booking.id,
            seat_id: seat.id,
            price: Number(seat.price),
          },
          { transaction },
        );
      }

      // Schedule unlock job for each seat
      for (const seatId of seatIds) {
        await this.seatQueue.add(
          JobInQueue[QueueName.SEAT].UNLOCK_SEAT,
          { seat_id: seatId },
          {
            jobId: `${booking.id}-${seatId}`,
            removeOnComplete: true,
            removeOnFail: true,
            delay: 1000 * 60 * 10, // 10 minutes
          },
        );
      }

      await transaction.commit();
      return booking;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
