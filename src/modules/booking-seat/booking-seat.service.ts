import { Injectable } from '@nestjs/common';
import { BookingSeatRepository } from './booking-seat.repository';
import { Transaction } from 'sequelize';

@Injectable()
export class BookingSeatService {
  constructor(
    private readonly bookingSeatRepository: BookingSeatRepository,
  ) {}

  async create(
    data: {
      booking_id: string;
      seat_id: string;
      price: number;
    },
    options?: { transaction?: Transaction },
  ) {
    return this.bookingSeatRepository.create(data, options);
  }

  async bulkCreate(
    data: Array<{
      booking_id: string;
      seat_id: string;
      price: number;
    }>,
    options?: { transaction?: Transaction },
  ) {
    return this.bookingSeatRepository.bulkCreate(data, options);
  }

  async findByBookingId(bookingId: string) {
    return this.bookingSeatRepository.findByBookingId(bookingId);
  }

  async findBySeatId(seatId: string) {
    return this.bookingSeatRepository.findBySeatId(seatId);
  }

  async deleteByBookingId(
    bookingId: string,
    options?: { transaction?: Transaction },
  ) {
    return this.bookingSeatRepository.deleteByBookingId(bookingId, options);
  }
}

