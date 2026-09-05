import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import type { RestaurantPermissionName } from '@restaurant/database/authorization';
import { REQUIRED_PLATFORM_PERMISSIONS_KEY } from '../constants/authorization.constants';
import { AccessTokenGuard } from '../guards/access-token.guard';
import { PlatformPermissionsGuard } from '../guards/platform-permissions.guard';

export const RequirePlatformPermissions = (...permissions: RestaurantPermissionName[]) =>
  applyDecorators(
    SetMetadata(REQUIRED_PLATFORM_PERMISSIONS_KEY, permissions),
    UseGuards(AccessTokenGuard, PlatformPermissionsGuard),
  );
