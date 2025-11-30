import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationFilter {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    title: 'Limit',
    format: 'int32',
    default: 10,
  })
  @Min(1)
  @Max(1000)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({
    minimum: 0,
    title: 'Page',
    format: 'int32',
    default: 0,
  })
  @Min(0)
  offset?: number = 0;
}
