import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  hasPlatformPermissions,
  type RestaurantPermissionName,
} from '@restaurant/database/authorization';
import type { AccessAuthUser } from '../../modules/auth/interfaces/auth-user.interface';
import { REQUIRED_PLATFORM_PERMISSIONS_KEY } from '../constants/authorization.constants';

@Injectable()
export class PlatformPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      RestaurantPermissionName[]
    >(REQUIRED_PLATFORM_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AccessAuthUser }>();
    if (!request.user) throw new UnauthorizedException();
    if (!hasPlatformPermissions(request.user.roles, required))
      throw new ForbiddenException('Insufficient platform permissions');
    return true;
  }
}
