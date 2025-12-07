import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { PinoLogger } from 'nestjs-pino';
import { ConfigServiceKeys } from 'src/common/constants';
import * as Models from 'src/models';

const sequelizeModule = SequelizeModule.forRootAsync({
  inject: [ConfigService, PinoLogger],
  useFactory: (configService: ConfigService, logger: PinoLogger) => {
    const masterHost = configService.getOrThrow(
      ConfigServiceKeys.DB_MASTER_HOST,
    );
    const slaveHost = configService.get<string>(
      ConfigServiceKeys.DB_SLAVE_HOST,
    );

    // Nếu có slave host thì dùng replication, nếu không thì dùng master cho cả read/write
    const config: any = {
      dialect: 'postgres',
      username: configService.getOrThrow(ConfigServiceKeys.DB_USERNAME),
      password: configService.getOrThrow(ConfigServiceKeys.DB_PASSWORD),
      database: configService.getOrThrow(ConfigServiceKeys.DB_NAME),
      port: +configService.get(ConfigServiceKeys.DB_PORT, 5432),
      models: Object.values(Models),
      timezone: configService.get(ConfigServiceKeys.TIMEZONE, 'UTC'),
      benchmark: true,
      pool: {
        max: 25,
        min: 0,
        idle: 60000,
      },
    };

    // Chỉ dùng replication nếu có slave host
    if (slaveHost) {
      config.replication = {
        read: slaveHost.split(',').map((slaveDbHost) => ({
          host: slaveDbHost.trim(),
        })),
        write: {
          host: masterHost,
        },
      };
    } else {
      // Không có slave, dùng master cho cả read và write
      config.host = masterHost;
    }

    // SSL config
    if (configService.get<string>(ConfigServiceKeys.DB_SSL_REQUIRED)) {
      config.dialectOptions = {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      };
    }

    return config;
  },
});

@Module({
  imports: [sequelizeModule],
})
export class DatabaseModule {}
