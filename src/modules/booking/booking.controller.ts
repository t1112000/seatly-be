import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import * as express from 'express';
import { BaseController } from 'src/common/base/base.controller';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { SeatModel } from 'src/models';
import { BookingService } from './booking.service';
import { CreateBookingRequestDto, FilterBookingDto } from './booking.dto';
import { PaymentService } from '../payment/payment.service';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('/v1/bookings')
export class BookingController extends BaseController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly paymentService: PaymentService,
  ) {
    super();
  }

  @Post()
  @ApiOperation({
    summary: 'Create booking for multiple seats and get payment link',
  })
  @ApiOkResponse({ description: 'Payment link created successfully' })
  async createBooking(
    @Body() body: CreateBookingRequestDto,
    @Req() request: express.Request,
    @Res() response: express.Response,
  ) {
    const userId = request.user?.id as string;

    // Create one booking with multiple seats
    const booking = await this.bookingService.createBookingForUser(
      userId,
      body,
    );

    // Create payment link for the booking
    const paymentLink = await this.paymentService.createPaymentLink(userId, {
      booking_id: booking.id,
      provider: body.payment_method,
    });

    return this.successResponse(response, paymentLink);
  }

  @Get('my-history')
  @ApiOperation({ summary: 'List my booking history' })
  @ApiOkResponse({ description: 'List of bookings' })
  async getMyHistory(
    @Req() request: express.Request,
    @Query() query: FilterBookingDto,
    @Res() response: express.Response,
  ) {
    const userId = request.user?.id as string;
    const payload = {
      ...query,
      user_id: userId,
    };
    const [rows, count] = await Promise.all([
      this.bookingService.findAll(payload, {
        include: [
          {
            model: SeatModel,
            attributes: ['id', 'seat_number', 'status', 'price', 'version'],
            through: { attributes: [] },
          },
        ],
      }),
      this.bookingService.count(payload),
    ]);
    return this.pagingResponse(response, {
      count,
      rows,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking detail by ID' })
  @ApiOkResponse({ description: 'Booking detail retrieved successfully' })
  async getBookingDetail(
    @Param('id') id: string,
    @Req() request: express.Request,
    @Res() response: express.Response,
  ) {
    const userId = request.user?.id as string;
    const booking = await this.bookingService.findById(id, {
      include: [
        {
          model: SeatModel,
          attributes: ['id', 'seat_number', 'status', 'price', 'version'],
          through: { attributes: [] },
        },
      ],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify that the booking belongs to the current user
    if (booking.user_id !== userId) {
      throw new ForbiddenException('Unauthorized access to this booking');
    }

    return this.successResponse(response, booking);
  }
}
