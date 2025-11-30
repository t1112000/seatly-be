import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { PinoLogger } from 'nestjs-pino';
import { ConfigServiceKeys } from 'src/common/constants';
import * as Models from 'src/models';

const sequelizeModule = SequelizeModule.forRootAsync({
  inject: [ConfigService, PinoLogger],
  useFactory: (configService: ConfigService, logger: PinoLogger) => ({
    dialect: 'postgres',
    username: configService.getOrThrow(ConfigServiceKeys.DB_USERNAME),
    password: configService.getOrThrow(ConfigServiceKeys.DB_PASSWORD),
    database: configService.getOrThrow(ConfigServiceKeys.DB_NAME),
    port: +configService.get(ConfigServiceKeys.DB_PORT, 5432),
    replication: {
      read: configService
        .getOrThrow(ConfigServiceKeys.DB_SLAVE_HOST)
        .split(',')
        .map((slaveDbHost) => ({
          host: slaveDbHost,
        })),
      write: {
        host: configService.getOrThrow(ConfigServiceKeys.DB_MASTER_HOST),
      },
    },
    dialectOptions: !!configService.get<string>(
      ConfigServiceKeys.DB_SSL_REQUIRED,
    )
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : undefined,
    models: Object.values(Models),
    timezone: configService.get(ConfigServiceKeys.TIMEZONE, 'UTC'),
    benchmark: true,
    pool: {
      max: 25,
      min: 0,
      idle: 60000,
    },
  }),
});

@Module({
  imports: [sequelizeModule],
})
export class DatabaseModule {}
