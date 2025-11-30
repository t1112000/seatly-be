import { IsNotEmpty, IsString } from 'class-validator';
import { UserEntity } from '../user/user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetMeResponseDto extends UserEntity {}
export class GoogleOAuthResponseDto extends UserEntity {}

export class GoogleOAuthDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Google access token' })
  access_token: string;
}
