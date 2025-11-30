import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { BaseModel } from 'src/common/base/base.model';
import { BookingStatusEnum } from 'src/common/enums';
import { SeatModel } from './seat.model';
import { UserModel } from './user.model';
import { BookingSeatModel } from './booking-seat.model';

@Table({
  modelName: 'bookings',
})
export class BookingModel extends BaseModel {
  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_id: string;

  @BelongsTo(() => UserModel)
  user: UserModel;

  @BelongsToMany(() => SeatModel, () => BookingSeatModel)
  seats: SeatModel[];

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount: number;

  @Column({
    type: DataType.ENUM(...Object.values(BookingStatusEnum)),
    allowNull: false,
    defaultValue: BookingStatusEnum.PENDING_PAYMENT,
  })
  status: BookingStatusEnum;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  payment_provider?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  provider_session_id?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  provider_transaction_id?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  expires_at?: Date;
}
