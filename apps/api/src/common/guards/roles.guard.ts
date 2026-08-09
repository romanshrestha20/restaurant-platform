import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PlatformRoleName } from '@restaurant/database/authorization';
import { REQUIRED_PLATFORM_ROLES_KEY } from '../constants/authorization.constants';
import { AccessAuthUser } from '../../modules/auth/interfaces/auth-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<PlatformRoleName[]>(
      REQUIRED_PLATFORM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AccessAuthUser;
    }>();

    if (!request.user) {
      throw new UnauthorizedException();
    }

    const allowed = requiredRoles.some((role) =>
      request.user?.roles.includes(role),
    );

    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
