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
import { UserModel } from 'src/models/user.model';
import { CreateUserDto, FilterUserDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(UserModel)
    private userModel: typeof UserModel,
  ) {}

  async create(
    payload: CreateUserDto,
    options?: CreateOptions<UserModel>,
  ): Promise<UserModel> {
    const result = await this.userModel.create(
      payload as unknown as CreationAttributes<UserModel>,
      options,
    );
    return result.get({ plain: true });
  }

  async update(
    id: string,
    payload: UpdateUserDto,
    options?: UpdateOptions<UserModel>,
  ): Promise<UserModel | null> {
    const result = await this.userModel.update(payload, {
      ...options,
      where: { id },
      returning: true,
    });
    if (result.length !== 2) {
      throw new Error('Can not update user');
    }
    return result[1]?.[0]?.get({ plain: true }) || null;
  }

  async bulkUpdate(
    where: WhereOptions<UserModel>,
    payload: UpdateUserDto,
    options?: UpdateOptions<UserModel>,
  ): Promise<UserModel[]> {
    const result = await this.userModel.update(payload, {
      ...options,
      where,
      returning: true,
    });
    return result?.[1] || [];
  }

  delete(
    id: string,
    options?: DestroyOptions<UserModel>,
  ): Promise<number | null> {
    return this.userModel.destroy({ ...options, where: { id } });
  }

  deleteByCondition(
    where: WhereOptions<UserModel>,
    options?: DestroyOptions<UserModel>,
  ): Promise<number | null> {
    return this.userModel.destroy({ ...options, where });
  }

  async findAll(
    condition: FilterUserDto,
    options?: FindOptions<UserModel>,
  ): Promise<UserModel[]> {
    const { limit, offset, ...rest } = condition;
    const users = await this.userModel.findAll({
      ...options,
      ...(limit && offset
        ? { limit: Number(limit), offset: Number(offset) }
        : {}),
      where: { ...rest },
      attributes: {
        exclude: [],
      },
      order: [['created_at', 'desc']],
    });
    return users.map((user) => user.transformToResponse());
  }

  count(
    condition: FilterUserDto,
    options?: CountOptions<UserModel>,
  ): Promise<number> {
    const { limit: _, offset: __, ...rest } = condition;
    return this.userModel.count({
      ...options,
      where: { ...rest },
    });
  }

  async findById(
    id: string,
    options?: FindOptions<UserModel>,
    isTransformToResponseEnabled = true,
  ): Promise<UserModel | null> {
    const user = await this.userModel.findOne({
      ...options,
      where: { id },
      plain: true,
    });
    if (isTransformToResponseEnabled) {
      return user?.transformToResponse();
    }
    return user?.get({ plain: true });
  }

  async findOne(
    condition: WhereOptions<UserModel>,
    options?: FindOptions<UserModel>,
    isTransformToResponseEnabled = true,
  ): Promise<UserModel | null> {
    const data = await this.userModel.findOne({
      ...options,
      where: {
        ...condition,
      },
      plain: true,
    });
    if (isTransformToResponseEnabled) {
      return data?.transformToResponse();
    }
    return data?.get({ plain: true });
  }
}
