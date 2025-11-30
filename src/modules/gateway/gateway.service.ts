import { ForbiddenException } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Server, Socket } from 'socket.io';
import { verifyJwtToken } from 'src/common/helpers/jwt.helper';
import { UserModel } from 'src/models';

@WebSocketGateway({
  transports: ['websocket'],
  cors: true,
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    @InjectPinoLogger(AppGateway.name)
    private logger: PinoLogger,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake?.auth?.token;

    if (!token) return;

    const user = await this.validateToken(token);
    await client.join(user.id);
  }

  async handleDisconnect(client: Socket) {
    const token = client.handshake?.auth?.token;
    if (!token) return;

    const user = await this.validateToken(token);
    await client.leave(user.id);
  }

  private async validateToken(auth_token: string): Promise<UserModel> {
    try {
      const [isTokenValid, user] = verifyJwtToken(auth_token);

      if (!isTokenValid) {
        throw new ForbiddenException('Token invalid');
      }

      if (user.exp) {
        const today = new Date();
        const expiresAt = new Date(user.exp * 1000);
        if (today > expiresAt) {
          throw new ForbiddenException('Token expired');
        }
      }

      return user as UserModel;
    } catch (error) {
      this.logger.error(error, 'Validate socket token error');
      throw error;
    }
  }
}
