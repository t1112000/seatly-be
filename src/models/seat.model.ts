import { BelongsToMany, Column, DataType, Table } from 'sequelize-typescript';
import { BaseModel } from 'src/common/base/base.model';
import { SeatStatusEnum, SeatTypeEnum } from 'src/common/enums';
import { BookingModel } from './booking.model';
import { BookingSeatModel } from './booking-seat.model';

@Table({
  modelName: 'seats',
  version: true,
})
export class SeatModel extends BaseModel {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  seat_number: string;

  @Column({
    type: DataType.ENUM(...Object.values(SeatTypeEnum)),
    allowNull: false,
    defaultValue: SeatTypeEnum.STANDARD,
  })
  type: SeatTypeEnum;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  row_label: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  col_number: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  price: number;

  @Column({
    type: DataType.ENUM(...Object.values(SeatStatusEnum)),
    allowNull: false,
    defaultValue: SeatStatusEnum.AVAILABLE,
  })
  status: SeatStatusEnum;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  version: number = 0;

  @BelongsToMany(() => BookingModel, () => BookingSeatModel)
  bookings: BookingModel[];
}
