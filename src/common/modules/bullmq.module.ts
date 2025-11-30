import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from '../enums/processor.enum';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigServiceKeys } from '../constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get(ConfigServiceKeys.REDIS_HOST),
          port: configService.get(ConfigServiceKeys.REDIS_PORT),
          password: configService.get(ConfigServiceKeys.REDIS_PASSWORD),
          db: configService.get(ConfigServiceKeys.REDIS_QUEUE_DATABASE),
          tls:
            configService.getOrThrow(ConfigServiceKeys.REDIS_SSL_REQUIRED) ===
            'true'
              ? {
                  rejectUnauthorized: false,
                }
              : undefined,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QueueName.SEAT,
    }),
  ],
  exports: [BullModule],
})
export class BullMQModule {}
