import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
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
import { ThrottlerGuard } from '@nestjs/throttler';
import * as express from 'express';
import { BaseController } from 'src/common/base/base.controller';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { UserService } from '../user/user.service';
import {
  GetMeResponseDto,
  GoogleOAuthDto,
  GoogleOAuthResponseDto,
} from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('/v1/auth')
@UseGuards(ThrottlerGuard)
export class AuthController extends BaseController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    super();
  }

  @Get('me')
  @ApiOkResponse({ type: GetMeResponseDto })
  @ApiOperation({ summary: 'Get me' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getMe(
    @Req() request: express.Request,
    @Res() response: express.Response,
  ) {
    const userId = request.user?.id as string;
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.successResponse(response, user);
  }

  @Post('google')
  @ApiOkResponse({ type: GoogleOAuthResponseDto })
  @ApiOperation({ summary: 'Google OAuth' })
  async googleLogin(
    @Res() response: express.Response,
    @Body() data: GoogleOAuthDto,
  ) {
    const token = await this.authService.googleOAuth(data);

    response.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days in milliseconds
    });

    return this.successResponse(response);
  }

  @Post('logout')
  @ApiOkResponse({ description: 'Logout successful' })
  @ApiOperation({ summary: 'Logout' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async logout(@Res() response: express.Response) {
    // Clear the cookie
    response.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return this.successResponse(response, { success: true });
  }
}
