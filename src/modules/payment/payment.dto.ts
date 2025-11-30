import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { PaymentProviderEnum } from 'src/common/enums';

export class CreatePaymentLinkDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  booking_id: string;

  @ApiProperty({
    enum: PaymentProviderEnum,
    required: true,
    default: PaymentProviderEnum.STRIPE,
  })
  @IsEnum(PaymentProviderEnum)
  @IsNotEmpty()
  provider: PaymentProviderEnum;
}

export class CreatePaymentLinkResponseDto {
  @ApiProperty()
  booking_id: string;

  @ApiProperty({ enum: PaymentProviderEnum })
  provider: PaymentProviderEnum;

  @ApiProperty()
  payment_url: string;

  @ApiProperty({ required: false })
  provider_session_id?: string;

  @ApiProperty({ required: false })
  provider_transaction_id?: string;

  @ApiProperty({ required: false, type: String })
  expires_at?: Date;
}
