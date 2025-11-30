import { Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { BaseController } from 'src/common/base/base.controller';
import { SeatStatusEnum } from 'src/common/enums';
import { BookingService } from '../booking/booking.service';
import { SeatService } from '../seat/seat.service';

@ApiTags('Admin')
@Controller('/admin')
export class AdminController extends BaseController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly seatService: SeatService,
  ) {
    super();
  }

  @Post('reset-system')
  @ApiOperation({
    summary: 'Clear all bookings and reset seats to AVAILABLE',
  })
  async resetSystem(@Res() response: express.Response) {
    await this.bookingService.deleteByCondition({});
    await this.seatService.bulkUpdate(
      {},
      { status: SeatStatusEnum.AVAILABLE, version: 0 },
    );
    return this.successResponse(response);
  }
}

