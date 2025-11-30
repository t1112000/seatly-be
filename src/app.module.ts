import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './modules/user/user.module';
import { SeatModule } from './modules/seat/seat.module';
import { BookingModule } from './modules/booking/booking.module';

import { CurlModule } from './modules/curl/curl.module';
import { AuthModule } from './modules/auth/auth.module';
import { CachingFactoryModule } from './modules/caching_factory/caching_factory.module';
import { ConfigServiceKeys } from './common/constants';
import * as redisStore from 'cache-manager-redis-store';
import { CacheModule } from '@nestjs/cache-manager';
import { GuardModule } from './common/guards/guard.module';
import { context, trace } from '@opentelemetry/api';
import { MetricsMiddleware } from './common/middlewares/metrics.middleware';
import { OtelTracingMiddleware } from './common/middlewares/otel_tracing.middleware';
import { BullMQModule } from './common/modules/bullmq.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppGatewayModule } from './modules/gateway/gateway.module';
import { AdminModule } from './modules/admin/admin.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const enabledLog = !['localhost']?.includes(
          configService.getOrThrow<string>(ConfigServiceKeys.NODE_ENV),
        );
        return {
          pinoHttp: {
            enabled: enabledLog,
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers["x-cxgenie-key"]',
              ],
              remove: true,
            },
            formatters: {
              log(object) {
                const span = trace.getSpan(context.active());
                if (!span) return { ...object };
                const currentTrace = trace
                  .getSpan(context.active())
                  ?.spanContext();
                if (!currentTrace) return { ...object };
                const { spanId, traceId } = currentTrace;
                return { ...object, spanId, traceId };
              },
              level(label) {
                return { level: label };
              },
            },
          },
          exclude: [
            { method: RequestMethod.GET, path: '/app/health-check' },
            { method: RequestMethod.GET, path: '/metrics' },
          ],
        };
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.getOrThrow(ConfigServiceKeys.REDIS_HOST),
        port: configService.getOrThrow(ConfigServiceKeys.REDIS_PORT),
        password: configService.getOrThrow(ConfigServiceKeys.REDIS_PASSWORD),
        db: configService.getOrThrow(ConfigServiceKeys.REDIS_CACHE_DATABASE),
        tls:
          configService.getOrThrow(ConfigServiceKeys.REDIS_SSL_REQUIRED) ===
          'true'
            ? {
                rejectUnauthorized: false,
              }
            : undefined,
      }),
    }),
    EventEmitterModule.forRoot({
      global: true,
      maxListeners: 50,
      verboseMemoryLeak: true,
    }),
    BullMQModule,
    GuardModule,
    DatabaseModule,
    UserModule,
    SeatModule,
    BookingModule,
    CurlModule,
    CachingFactoryModule,
    AuthModule,
    AppGatewayModule,
    AdminModule,
    WebhookModule,
    PaymentModule,
  ],
  controllers: [AppController],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MetricsMiddleware, OtelTracingMiddleware)
      .exclude(
        { method: RequestMethod.GET, path: '/app/health-check' },
        { method: RequestMethod.GET, path: '/metrics' },
      )
      .forRoutes('*');
  }
}
