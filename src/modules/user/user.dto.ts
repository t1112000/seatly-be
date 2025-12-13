import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UserEntity {
  @ApiProperty({
    required: true,
    nullable: false,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: true,
    nullable: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  google_id?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  stripe_customer_id?: string;
}

export class CreateUserDto extends UserEntity {}

export class UpdateUserDto extends PartialType(UserEntity) {}

export class FilterUserDto extends UserEntity {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'number of skipped records',
    default: 0,
    minimum: 0,
  })
  offset?: number = 0;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @ApiProperty({
    description: 'number of taken records',
    default: 10,
    minimum: 1,
    maximum: 1000,
  })
  limit?: number = 10;
}
