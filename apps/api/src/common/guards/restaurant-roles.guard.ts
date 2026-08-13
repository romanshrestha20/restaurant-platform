import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  isRestaurantRole,
  hasRestaurantPermissions,
  restaurantPermissionsForRole,
  type RestaurantPermissionName,
  type RestaurantRoleName,
} from '@restaurant/database/authorization';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessAuthUser } from '../../modules/auth/interfaces/auth-user.interface';
import { REQUIRED_RESTAURANT_ROLES_KEY } from '../constants/authorization.constants';
import { REQUIRED_RESTAURANT_PERMISSIONS_KEY } from '../constants/authorization.constants';

export interface RestaurantMembershipAuth {
  restaurantId: string;
  userId: string;
  role: RestaurantRoleName;
  permissions: readonly RestaurantPermissionName[];
}

type RestaurantRequest = {
  user?: AccessAuthUser;
  params?: { restaurantId?: string };
  restaurantMembership?: RestaurantMembershipAuth;
};

@Injectable()
export class RestaurantRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<
      RestaurantRoleName[]
    >(REQUIRED_RESTAURANT_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<
      RestaurantPermissionName[]
    >(REQUIRED_RESTAURANT_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RestaurantRequest>();
    if (!request.user) {
      throw new UnauthorizedException();
    }

    const restaurantId = request.params?.restaurantId;
    if (!restaurantId) {
      throw new BadRequestException('restaurantId route parameter is required');
    }

    const membership = await this.prisma.restaurantMember.findUnique({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId: request.user.id,
        },
      },
      select: {
        role: { select: { name: true } },
        restaurant: {
          select: { isActive: true, deletedAt: true },
        },
      },
    });

    if (
      !membership ||
      !membership.restaurant.isActive ||
      membership.restaurant.deletedAt !== null ||
      !isRestaurantRole(membership.role.name) ||
      (requiredRoles?.length && !requiredRoles.includes(membership.role.name)) ||
      (requiredPermissions?.length &&
        !hasRestaurantPermissions(membership.role.name, requiredPermissions))
    ) {
      throw new ForbiddenException('Insufficient restaurant permissions');
    }

    request.restaurantMembership = {
      restaurantId,
      userId: request.user.id,
      role: membership.role.name,
      permissions: restaurantPermissionsForRole(membership.role.name),
    };

    return true;
  }
}
