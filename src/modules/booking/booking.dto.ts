import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BookingStatusEnum, PaymentProviderEnum } from 'src/common/enums';

export class BookingEntity {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({ example: 150000 })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  amount: number;

  @ApiProperty({
    enum: BookingStatusEnum,
    default: BookingStatusEnum.PENDING_PAYMENT,
    required: false,
  })
  @IsEnum(BookingStatusEnum)
  @IsOptional()
  status?: BookingStatusEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  payment_provider?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  provider_session_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  provider_transaction_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  expires_at?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  created_at?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  updated_at?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  deleted_at?: Date;
}

export class CreateBookingDto extends OmitType(BookingEntity, [
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
]) {}

export class UpdateBookingDto extends PartialType(
  OmitType(BookingEntity, ['created_at', 'updated_at', 'deleted_at']),
) {}

export class FilterBookingDto {
  @ApiProperty({
    description: 'number of skipped records',
    default: 0,
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  offset?: number = 0;

  @ApiProperty({
    description: 'number of taken records',
    default: 10,
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}

export class CreateBookingRequestDto {
  @ApiProperty({ type: [String], description: 'Array of seat IDs to book' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  seat_ids: string[];

  @ApiProperty({
    enum: PaymentProviderEnum,
    description: 'Payment method',
    example: PaymentProviderEnum.MOMO,
  })
  @IsEnum(PaymentProviderEnum)
  @IsNotEmpty()
  payment_method: PaymentProviderEnum;
}
