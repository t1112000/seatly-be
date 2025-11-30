import {
  createParamDecorator,
  CustomDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';


export interface Roles {
  roles: any[];
}

export const ROLES_KEY = 'role';

export const Roles = (role: Roles): CustomDecorator =>
  SetMetadata(ROLES_KEY, role);

export const currentPermissions = createParamDecorator(
  (_, context: ExecutionContext) => {
    const req: any = context.switchToHttp().getRequest();
    const { roles } = req;

    return roles || [];
  },
);
