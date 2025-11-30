import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BookingSeatModel } from 'src/models';
import { Transaction } from 'sequelize';

@Injectable()
export class BookingSeatRepository {
  constructor(
    @InjectModel(BookingSeatModel)
    private readonly bookingSeatModel: typeof BookingSeatModel,
  ) {}

  async create(
    data: {
      booking_id: string;
      seat_id: string;
      price: number;
    },
    options?: { transaction?: Transaction },
  ) {
    return this.bookingSeatModel.create(data, options);
  }

  async bulkCreate(
    data: Array<{
      booking_id: string;
      seat_id: string;
      price: number;
    }>,
    options?: { transaction?: Transaction },
  ) {
    return this.bookingSeatModel.bulkCreate(data, options);
  }

  async findByBookingId(bookingId: string) {
    return this.bookingSeatModel.findAll({
      where: { booking_id: bookingId },
    });
  }

  async findBySeatId(seatId: string) {
    return this.bookingSeatModel.findAll({
      where: { seat_id: seatId },
    });
  }

  async deleteByBookingId(
    bookingId: string,
    options?: { transaction?: Transaction },
  ) {
    return this.bookingSeatModel.destroy({
      where: { booking_id: bookingId },
      ...options,
    });
  }
}

