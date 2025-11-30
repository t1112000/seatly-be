import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class RequestCurlDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsOptional()
  addheaders?: any;

  @IsBoolean()
  @IsOptional()
  bearer?: boolean;

  @IsNumber()
  @IsOptional()
  timeout?: number;
}

export class GetCurlPayloadDto extends RequestCurlDto {
  @IsOptional()
  serviceToken?: string;

  @IsOptional()
  query?: any;

  @IsOptional()
  params?: any;

  @IsOptional()
  another_config?: any;
}

export class PostCurlPayloadDto extends RequestCurlDto {
  @IsNotEmpty()
  @IsOptional()
  data?: any;

  @IsOptional()
  serviceToken?: string;
}

export class PutCurlPayloadDto extends RequestCurlDto {
  @IsOptional()
  @IsNotEmpty()
  data?: any;
}

export class DeleteCurlPayloadDto extends RequestCurlDto {
  @IsOptional()
  @IsNotEmpty()
  data?: any;
}

export class PatchCurlPayloadDto extends RequestCurlDto {
  @IsOptional()
  @IsNotEmpty()
  data?: any;
}