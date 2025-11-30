import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { verifyJwtToken } from 'src/common/helpers/jwt.helper';
import { Reflector } from '@nestjs/core';
import { Roles, ROLES_KEY } from '../decorators/roles.decorator';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      cluster_id?: string;
    }
  }
}

@Injectable()
export class ClusterAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) {}
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const roles = this.reflector.getAllAndOverride<Roles>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!request.headers.authorization) {
      return false;
    }
    const [scheme, token] = request.headers.authorization.split(' ');
    if (scheme !== 'Bearer') {
      return false;
    }
    const [isValid, data] = verifyJwtToken(token);
    if (!isValid) return false;

    // const isActive = await this.permissionService.validateAction(data, roles);
    request.cluster_id = data.cluster_id;

    // if (!isActive) {
    //   throw new ForbiddenException('User verification required');
    // }

    return true;
  }
}
