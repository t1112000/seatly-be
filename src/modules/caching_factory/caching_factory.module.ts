import { Global, Module } from '@nestjs/common';
import { CachingFactory } from './caching_factory.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { ConfigServiceKeys } from 'src/common/constants';
import { RateLimitEnum, RateLimitTTLEnum } from 'src/common/enums';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        storage: new ThrottlerStorageRedisService(
          new Redis({
            host: configService.get(ConfigServiceKeys.REDIS_HOST),
            port: configService.get(ConfigServiceKeys.REDIS_PORT),
            password: configService.get(ConfigServiceKeys.REDIS_PASSWORD),
            db: configService.get(ConfigServiceKeys.REDIS_CACHE_DATABASE),
            tls:
              configService.getOrThrow(ConfigServiceKeys.REDIS_SSL_REQUIRED) ===
              'true'
                ? {
                    rejectUnauthorized: false,
                  }
                : undefined,
          }),
        ),
        throttlers: [
          {
            limit: RateLimitEnum.LIMIT_5_TIMES,
            ttl: RateLimitTTLEnum.EVERY_5_SECONDS,
          },
        ],
      }),
    }),
  ],

  providers: [
    CachingFactory,
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        return new Redis({
          host: configService.get(ConfigServiceKeys.REDIS_HOST),
          port: configService.get(ConfigServiceKeys.REDIS_PORT),
          password: configService.get(ConfigServiceKeys.REDIS_PASSWORD),
          db: configService.get(ConfigServiceKeys.REDIS_CACHE_DATABASE),
          tls:
            configService.getOrThrow(ConfigServiceKeys.REDIS_SSL_REQUIRED) ===
            'true'
              ? {
                  rejectUnauthorized: false,
                }
              : undefined,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [CachingFactory, 'REDIS_CLIENT'],
})
export class CachingFactoryModule {}
