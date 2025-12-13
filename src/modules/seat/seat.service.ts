import { Injectable } from '@nestjs/common';
import { FindOptions, Op, UpdateOptions, WhereOptions } from 'sequelize';
import { SeatModel } from 'src/models';
import {
  CreateSeatDto,
  FilterSeatDto,
  UpdateSeatDto,
} from 'src/modules/seat/seat.dto';
import { SeatRepository } from './seat.repository';

@Injectable()
export class SeatService {
  constructor(private readonly seatRepository: SeatRepository) {}

  async findAll(payload: FilterSeatDto, options?: FindOptions<SeatModel>) {
    return this.seatRepository.findAll(payload, options);
  }

  async findById(
    id: string,
    isTransformToResponseEnabled = true,
    options?: FindOptions<SeatModel>,
  ) {
    return this.seatRepository.findById(
      id,
      options,
      isTransformToResponseEnabled,
    );
  }

  async findOne(
    condition: WhereOptions<SeatModel>,
    isTransformToResponseEnabled = true,
    options?: FindOptions<SeatModel>,
  ) {
    return this.seatRepository.findOne(
      condition,
      options,
      isTransformToResponseEnabled,
    );
  }

  async create(payload: CreateSeatDto, options?: any) {
    return this.seatRepository.create(payload, options);
  }

  async update(
    id: string,
    payload: UpdateSeatDto,
    options?: Omit<UpdateOptions<SeatModel>, 'where'>,
  ) {
    return this.seatRepository.update(id, payload, options);
  }

  async updateByCondition(
    where: WhereOptions<SeatModel>,
    payload: UpdateSeatDto,
    options?: Omit<UpdateOptions<SeatModel>, 'where'>,
  ) {
    return this.seatRepository.updateByCondition(where, payload, options);
  }

  async delete(id: string) {
    return this.seatRepository.delete(id);
  }

  async deleteByCondition(condition: WhereOptions<SeatModel>) {
    return this.seatRepository.deleteByCondition(condition);
  }

  async bulkUpdate(where: WhereOptions<SeatModel>, payload: UpdateSeatDto) {
    return this.seatRepository.bulkUpdate(where, payload);
  }

  async count(payload: FilterSeatDto) {
    return this.seatRepository.count(payload);
  }
}
