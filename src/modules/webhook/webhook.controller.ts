import { Body, Controller, Headers, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { BaseController } from 'src/common/base/base.controller';
import { WebhookService } from './webhook.service';

@ApiTags('Webhooks')
@Controller('/webhook')
export class WebhookController extends BaseController {
  constructor(private readonly webhookService: WebhookService) {
    super();
  }

  @Post('stripe')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleStripeWebhook(
    @Body() payload: Record<string, any>,
    @Headers('stripe-signature') signature: string,
    @Res() response: express.Response,
  ) {
    await this.webhookService.handleStripeWebhook(payload, signature);
    return this.successResponse(response);
  }

  @Post('momo')
  @ApiOperation({ summary: 'MoMo webhook handler' })
  async handleMomoWebhook(
    @Body() payload: Record<string, any>,
    @Res() response: express.Response,
  ) {
    const result = await this.webhookService.handleMomoWebhook(payload);
    return response.status(200).json(result);
  }
}
