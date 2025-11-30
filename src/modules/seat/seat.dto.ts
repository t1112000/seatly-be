import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { SeatStatusEnum, SeatTypeEnum } from 'src/common/enums';

export class SeatEntity {
  @ApiProperty({ example: 'A01' })
  @IsString()
  @IsNotEmpty()
  seat_number: string;

  @ApiProperty({
    enum: SeatTypeEnum,
    default: SeatTypeEnum.STANDARD,
    required: false,
  })
  @IsEnum(SeatTypeEnum)
  @IsOptional()
  type?: SeatTypeEnum;

  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  row_label: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  col_number: number;

  @ApiProperty({ example: 150000 })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  price: number;

  @ApiProperty({
    enum: SeatStatusEnum,
    default: SeatStatusEnum.AVAILABLE,
    required: false,
  })
  @IsEnum(SeatStatusEnum)
  @IsOptional()
  status?: SeatStatusEnum;

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

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  version?: number;
}

export class CreateSeatDto extends OmitType(SeatEntity, [
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
  'version',
]) {}

export class UpdateSeatDto extends PartialType(
  OmitType(SeatEntity, ['created_at', 'updated_at', 'deleted_at']),
) {}

export class FilterSeatDto {}
