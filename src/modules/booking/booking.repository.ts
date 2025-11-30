import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  CountOptions,
  CreateOptions,
  CreationAttributes,
  DestroyOptions,
  FindOptions,
  UpdateOptions,
  WhereOptions,
} from 'sequelize';
import { BookingModel } from 'src/models';
import {
  CreateBookingDto,
  FilterBookingDto,
  UpdateBookingDto,
} from './booking.dto';

@Injectable()
export class BookingRepository {
  constructor(
    @InjectModel(BookingModel)
    private readonly bookingModel: typeof BookingModel,
  ) {}

  async create(
    payload: CreateBookingDto,
    options?: CreateOptions<BookingModel>,
  ): Promise<BookingModel> {
    const result = await this.bookingModel.create(
      payload as unknown as CreationAttributes<BookingModel>,
      options,
    );
    return result.get({ plain: true });
  }

  async update(
    id: string,
    payload: UpdateBookingDto,
    options?: UpdateOptions<BookingModel>,
  ): Promise<BookingModel | null> {
    const [count, rows] = await this.bookingModel.update(payload, {
      ...options,
      where: { id },
      returning: true,
    });
    if (count === 0 || !rows?.length) {
      throw new Error('Unable to update booking');
    }
    return rows[0]?.get({ plain: true }) || null;
  }

  async bulkUpdate(
    where: WhereOptions<BookingModel>,
    payload: UpdateBookingDto,
    options?: UpdateOptions<BookingModel>,
  ): Promise<BookingModel[]> {
    const [, rows] = await this.bookingModel.update(payload, {
      ...options,
      where,
      returning: true,
    });
    return rows || [];
  }

  delete(id: string, options?: DestroyOptions<BookingModel>): Promise<number> {
    return this.bookingModel.destroy({ ...options, where: { id } });
  }

  deleteByCondition(
    where: WhereOptions<BookingModel>,
    options?: DestroyOptions<BookingModel>,
  ): Promise<number> {
    return this.bookingModel.destroy({ ...options, where });
  }

  async findAll(
    condition: FilterBookingDto,
    options?: FindOptions<BookingModel>,
  ): Promise<BookingModel[]> {
    const { limit, offset, ...rest } = condition;
    const rows = await this.bookingModel.findAll({
      ...options,
      ...(limit !== undefined && offset !== undefined
        ? { limit: Number(limit), offset: Number(offset) }
        : {}),
      where: { ...rest },
      order: options?.order || [['created_at', 'desc']],
    });
    return rows.map((row) => row.transformToResponse());
  }

  count(
    condition: FilterBookingDto,
    options?: CountOptions<BookingModel>,
  ): Promise<number> {
    const { limit: _limit, offset: _offset, ...rest } = condition;
    return this.bookingModel.count({
      ...options,
      where: { ...rest },
    });
  }

  async findById(
    id: string,
    options?: FindOptions<BookingModel>,
  ): Promise<BookingModel | null> {
    const booking = await this.bookingModel.findOne({
      ...options,
      where: { id },
      plain: true,
    });
    if (!booking) {
      return null;
    }
    return booking.get({ plain: true });
  }

  async findOne(
    condition: WhereOptions<BookingModel>,
    options?: FindOptions<BookingModel>,
  ): Promise<BookingModel | null> {
    const booking = await this.bookingModel.findOne({
      ...options,
      where: { ...condition },
      plain: true,
    });
    if (!booking) {
      return null;
    }
    return booking.get({ plain: true });
  }
}
