import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsBoolean, IsObject } from "class-validator";

export class BaseResponseDto {
  @ApiProperty({
    type: 'boolean',
    description: 'request status',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    type: 'object',
    description: 'response data',
    example: {},
    additionalProperties: false,
  })
  @IsObject()
  data?: any;
}