import { IsNotEmpty, IsString } from "class-validator";

export class CachingFactoryResetDto {
  @IsNotEmpty()
  @IsString()
  password: string;
}