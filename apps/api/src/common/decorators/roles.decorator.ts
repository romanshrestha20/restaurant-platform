import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import type {
  PlatformRoleName,
  RestaurantRoleName,
  RestaurantPermissionName,
} from '@restaurant/database/authorization';
import {
  REQUIRED_PLATFORM_ROLES_KEY,
  REQUIRED_RESTAURANT_ROLES_KEY,
  REQUIRED_RESTAURANT_PERMISSIONS_KEY,
} from '../constants/authorization.constants';
import { AccessTokenGuard } from '../guards/access-token.guard';
import { RestaurantRolesGuard } from '../guards/restaurant-roles.guard';
import { RolesGuard } from '../guards/roles.guard';

export const RequirePlatformRoles = (...roles: PlatformRoleName[]) =>
  applyDecorators(
    SetMetadata(REQUIRED_PLATFORM_ROLES_KEY, roles),
    UseGuards(AccessTokenGuard, RolesGuard),
  );

export const RequireRestaurantRoles = (...roles: RestaurantRoleName[]) =>
  applyDecorators(
    SetMetadata(REQUIRED_RESTAURANT_ROLES_KEY, roles),
    UseGuards(AccessTokenGuard, RestaurantRolesGuard),
  );

export const RequireRestaurantPermissions = (
  ...permissions: RestaurantPermissionName[]
) =>
  applyDecorators(
    SetMetadata(REQUIRED_RESTAURANT_PERMISSIONS_KEY, permissions),
    UseGuards(AccessTokenGuard, RestaurantRolesGuard),
  );
