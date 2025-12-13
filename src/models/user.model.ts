import { Column, DataType, Table } from 'sequelize-typescript';
import { BaseModel } from 'src/common/base/base.model';

@Table({
  modelName: 'users',
})
export class UserModel extends BaseModel {
  @Column({
    type: DataType.STRING,
  })
  email: string;

  @Column({
    type: DataType.STRING,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    defaultValue: null,
    allowNull: true,
  })
  google_id: string;

  @Column({
    type: DataType.STRING,
    defaultValue: null,
    allowNull: true,
  })
  stripe_customer_id: string;
}
