import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { BaseController } from 'src/common/base/base.controller';
import { FilterSeatDto, SeatEntity } from './seat.dto';
import { SeatService } from './seat.service';

@ApiTags('Seats')
@Controller('/v1/seats')
export class SeatController extends BaseController {
  constructor(private readonly seatService: SeatService) {
    super();
  }

  @Get()
  @ApiOperation({ summary: 'List available seats' })
  @ApiOkResponse({ type: SeatEntity, isArray: true })
  async listSeats(
    @Query() query: FilterSeatDto,
    @Res() response: express.Response,
  ) {
    const rows = await this.seatService.findAll(query);
    return this.successResponse(response, rows);
  }
}
