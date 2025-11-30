import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-streams-adapter';
import { createClient } from 'redis';
import { ConfigService } from '@nestjs/config';
import { ConfigServiceKeys } from '../constants';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private configService: ConfigService;
  async connectToRedis(): Promise<void> {
    this.configService = new ConfigService();
    const host = this.configService.get<string>(ConfigServiceKeys.REDIS_HOST);
    const port = this.configService.get<number>(ConfigServiceKeys.REDIS_PORT);
    const password = this.configService.get<string>(
      ConfigServiceKeys.REDIS_PASSWORD,
    );
    const tls =
      this.configService.get<string>(ConfigServiceKeys.REDIS_SSL_REQUIRED) ===
      'true';

    const redisClient = createClient({
      url: `redis://${host}:${port}`,
      password,
      database: 1,
      ...(tls && {
        socket: {
          tls: true,
          rejectUnauthorized: false,
        },
      }),
    });

    await redisClient.connect();
    this.adapterConstructor = createAdapter(redisClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
