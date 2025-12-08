import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import expressBasicAuth from 'express-basic-auth';
import { AllExceptionFilter } from './common/exceptions/all.exception';
import { json, urlencoded } from 'express';
import { RedisIoAdapter } from './common/adapter/redis.adapter';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Configure WebSocket adapter
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const configService: ConfigService = app.get(ConfigService);
  const env = configService.get<string>('NODE_ENV');
  const clientUrl = configService.get<string>('CLIENT_URL');
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Trust proxy (needed for Cloudflare/HTTPS behind proxy)
  // const expressApp = app.getHttpAdapter().getInstance();
  // expressApp.set('trust proxy', true);

  // Apply middleware BEFORE CORS and global prefix
  app.use(cookieParser()); // Enable cookie parsing
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: clientUrl,
    credentials: true,
    maxAge: 3600, // 🕒 Cache preflight for 1 hours
  });
  app.setGlobalPrefix('/api');

  app.useGlobalFilters(new AllExceptionFilter());

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: env === 'production',
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'development') {
    app.use(
      '/api-document*',
      expressBasicAuth({
        challenge: true,
        users: {
          ['admin']: 'admin',
        },
      }),
    );
  }

  const config = new DocumentBuilder()
    .addBearerAuth()
    .addServer('/')
    .setTitle('Seatly API document')
    .setDescription(
      'This document provides information about apis of Seatly Application',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(
    (process.env.GATE_WAY_PREFIX ? process.env.GATE_WAY_PREFIX + '/' : '') +
      'api-document',
    app,
    document,
    {
      swaggerOptions: {
        apisSorter: 'alpha',
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        persistAuthorization: true,
        docExpansion: 'none',
      },
      customCss:
        'body { padding-bottom: 4rem; } .swagger-ui section.models { display: none; }',
      customSiteTitle: 'Seatly API Document',
    },
  );
  const port: number = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0', () =>
    console.log(`Server is running on 0.0.0.0:${port}`),
  );
}
bootstrap();
