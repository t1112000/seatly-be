import { Injectable } from '@nestjs/common';
import { FindOptions, WhereOptions } from 'sequelize';
import { UserModel } from 'src/models';
import { CreateUserDto, FilterUserDto, UpdateUserDto } from './user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll(payload: FilterUserDto) {
    return this.userRepository.findAll(payload);
  }

  async findById(
    id: string,
    isTransformToResponseEnabled = true,
    options?: FindOptions<UserModel>,
  ) {
    return this.userRepository.findById(
      id,
      options,
      isTransformToResponseEnabled,
    );
  }

  async findOne(
    payload: WhereOptions<UserModel>,
    isTransformToResponseEnabled = true,
  ) {
    return this.userRepository.findOne(
      payload,
      undefined,
      isTransformToResponseEnabled,
    );
  }

  async create(payload: CreateUserDto, options?: any) {
    const user = await this.userRepository.create(payload, options);

    return user;
  }

  async update(id: string, payload: UpdateUserDto) {
    return this.userRepository.update(id, payload);
  }

  async delete(id: string) {
    return this.userRepository.delete(id);
  }

  async deleteByCondition(payload: WhereOptions<UserModel>) {
    return this.userRepository.deleteByCondition(payload);
  }

  async bulkUpdate(where: WhereOptions<UserModel>, payload: UpdateUserDto) {
    return this.userRepository.bulkUpdate(where, payload);
  }

  async count(payload: FilterUserDto) {
    return this.userRepository.count(payload);
  }
}
