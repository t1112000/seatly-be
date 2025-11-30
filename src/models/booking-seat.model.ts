import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { BaseModel } from 'src/common/base/base.model';
import { BookingModel } from './booking.model';
import { SeatModel } from './seat.model';

@Table({
  modelName: 'booking_seats',
  timestamps: true,
})
export class BookingSeatModel extends BaseModel {
  @ForeignKey(() => BookingModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  booking_id: string;

  @BelongsTo(() => BookingModel)
  booking: BookingModel;

  @ForeignKey(() => SeatModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  seat_id: string;

  @BelongsTo(() => SeatModel)
  seat: SeatModel;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  price: number;
}

