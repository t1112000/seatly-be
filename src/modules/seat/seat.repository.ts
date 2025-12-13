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
import { SeatModel } from 'src/models';
import { CreateSeatDto, FilterSeatDto, UpdateSeatDto } from './seat.dto';

@Injectable()
export class SeatRepository {
  constructor(
    @InjectModel(SeatModel)
    private readonly seatModel: typeof SeatModel,
  ) {}

  async create(
    payload: CreateSeatDto,
    options?: CreateOptions<SeatModel>,
  ): Promise<SeatModel> {
    const result = await this.seatModel.create(
      payload as unknown as CreationAttributes<SeatModel>,
      options,
    );
    return result.get({ plain: true });
  }

  async update(
    id: string,
    payload: UpdateSeatDto,
    options?: Omit<UpdateOptions<SeatModel>, 'where'>,
  ): Promise<SeatModel | null> {
    // Use instance.save() to trigger optimistic locking (version check)
    const seat = await this.seatModel.findOne({
      where: { id },
      transaction: options?.transaction,
      lock: options?.transaction ? true : undefined,
    });
    if (!seat) {
      return null;
    }
    seat.set(payload);
    await seat.save({ transaction: options?.transaction });
    return seat.get({ plain: true });
  }

  async updateByCondition(
    where: WhereOptions<SeatModel>,
    payload: UpdateSeatDto,
    options?: Omit<UpdateOptions<SeatModel>, 'where'>,
  ): Promise<SeatModel | null> {
    // Use instance.save() to trigger optimistic locking (version check)
    const seat = await this.seatModel.findOne({
      where,
      transaction: options?.transaction,
      lock: options?.transaction ? true : undefined,
    });
    if (!seat) {
      return null;
    }
    seat.set(payload);
    await seat.save({ transaction: options?.transaction });
    return seat.get({ plain: true });
  }

  async bulkUpdate(
    where: WhereOptions<SeatModel>,
    payload: UpdateSeatDto,
    options?: UpdateOptions<SeatModel>,
  ): Promise<SeatModel[]> {
    const [, rows] = await this.seatModel.update(payload, {
      ...options,
      where,
      returning: true,
    });
    return rows || [];
  }

  delete(id: string, options?: DestroyOptions<SeatModel>): Promise<number> {
    return this.seatModel.destroy({ ...options, where: { id } });
  }

  deleteByCondition(
    where: WhereOptions<SeatModel>,
    options?: DestroyOptions<SeatModel>,
  ): Promise<number> {
    return this.seatModel.destroy({ ...options, where });
  }

  async findAll(
    condition: FilterSeatDto,
    options?: FindOptions<SeatModel>,
  ): Promise<SeatModel[]> {
    const { ...rest } = condition;
    const rows = await this.seatModel.findAll({
      ...options,
      where: { ...rest },
      order: options?.order || [['created_at', 'desc']],
    });
    return rows.map((row) => row.transformToResponse());
  }

  count(
    condition: FilterSeatDto,
    options?: CountOptions<SeatModel>,
  ): Promise<number> {
    const { ...rest } = condition;
    return this.seatModel.count({
      ...options,
      where: { ...rest },
    });
  }

  async findById(
    id: string,
    options?: FindOptions<SeatModel>,
    isTransformToResponseEnabled = true,
  ): Promise<SeatModel | null> {
    const seat = await this.seatModel.findOne({
      ...options,
      where: { id },
      plain: true,
    });
    if (!seat) {
      return null;
    }
    return isTransformToResponseEnabled
      ? seat.transformToResponse()
      : seat.get({ plain: true });
  }

  async findOne(
    condition: WhereOptions<SeatModel>,
    options?: FindOptions<SeatModel>,
    isTransformToResponseEnabled = true,
  ): Promise<SeatModel | null> {
    const seat = await this.seatModel.findOne({
      ...options,
      where: { ...condition },
      plain: true,
    });
    if (!seat) {
      return null;
    }
    return isTransformToResponseEnabled
      ? seat.transformToResponse()
      : seat.get({ plain: true });
  }
}
