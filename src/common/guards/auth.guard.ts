import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { verifyJwtToken } from 'src/common/helpers/jwt.helper';
import { Reflector } from '@nestjs/core';
import * as express from 'express';
import { ConfigService } from '@nestjs/config';
import { ConfigServiceKeys } from '../constants';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id?: string;
      full_name?: string;
      email?: string;
      username?: string;
      exp?: number;
      admin_workspace?: string[];
    }
    interface Customer {
      id: string;
      name?: string;
      email?: string;
      workspace_id: string;
    }
    export interface Request {
      user?: User;
      guestCustomer?: Customer;
      email?: string;
      agent_id?: string;
    }
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(ConfigService)
    private configService: ConfigService,
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );

    if (isPublic) {
      return true;
    }

    return this.validateRequest(request);
  }

  async validateRequest(request: express.Request) {
    try {
      let token: string | undefined;

      // First, try to get token from cookie
      if (request.cookies?.accessToken) {
        token = request.cookies.accessToken;
      }

      if (!token) {
        return false;
      }

      const [isValid, user] = verifyJwtToken(token);
      if (!isValid) return false;
      if (user.exp) {
        const today = new Date();
        const expiresAt = new Date(user.exp * 1000);
        if (today > expiresAt) {
          throw new ForbiddenException('Token expired');
        }
      }
      request.user = { ...request.user, ...user };

      // const isActive = await this.permissionService.checkUserIsActive(user?.id);
      // if (!isActive) {
      //   throw new ForbiddenException('User verification required');
      // }

      return true;
    } catch (error) {
      throw new ForbiddenException('Token invalid');
    }
  }
}
