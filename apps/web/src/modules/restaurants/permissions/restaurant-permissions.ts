import type {
  RestaurantMembership,
  RestaurantPermission,
} from '../types/restaurant.types';

export function canRestaurant(
  membership: RestaurantMembership | null,
  permission: RestaurantPermission,
): boolean {
  return membership?.callerPermissions.includes(permission) ?? false;
}

export function hasRestaurantPermission(
  permissions: readonly RestaurantPermission[],
  permission: RestaurantPermission,
): boolean {
  return permissions.includes(permission);
}
