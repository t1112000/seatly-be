import { Controller, Get, Res } from '@nestjs/common';
import * as express from 'express';

@Controller('/')
export class AppController {
  @Get('/health')
  async healthCheck(@Res() response: express.Response) {
    return response.status(200).json('OK');
  }
}
