import { Global, Module } from '@nestjs/common';
import { AppGateway } from './gateway.service';

@Global()
@Module({
  imports: [],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class AppGatewayModule {}
