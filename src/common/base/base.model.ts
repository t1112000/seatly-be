import {
  Model,
  Column,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  DataType,
  PrimaryKey,
} from 'sequelize-typescript';

export class BaseModel<
  TModelAttributes extends Record<string, any> = any,
> extends Model<TModelAttributes> {
  @PrimaryKey
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
  declare id: string;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  @DeletedAt
  deleted_at?: Date;

  transformToResponse() {
    return JSON.parse(JSON.stringify(this));
  }
}
