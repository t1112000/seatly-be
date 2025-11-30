import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { Redis } from 'ioredis';
import { ConfigServiceKeys } from 'src/common/constants';
import { RateLimitEnum, RateLimitTTLEnum } from 'src/common/enums';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CurlModule } from '../curl/curl.module';

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
    UserModule,
    CurlModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
