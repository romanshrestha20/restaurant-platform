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
