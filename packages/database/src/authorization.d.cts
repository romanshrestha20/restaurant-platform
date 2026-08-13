export declare const PLATFORM_ROLE_NAMES: readonly ['ADMIN', 'CUSTOMER'];
export declare const RESTAURANT_ROLE_NAMES: readonly [
  'OWNER',
  'MANAGER',
  'CHEF',
  'WAITER',
];
export declare const RESTAURANT_PERMISSION_NAMES: readonly [
  'restaurant.read',
  'restaurant.update',
  'menu.read',
  'menu.create',
  'menu.update',
  'menu.delete',
  'orders.read',
  'orders.update',
  'reservations.read',
  'reservations.update',
  'customers.read',
  'staff.read',
  'staff.manage',
];
export declare const ROLE_NAMES: readonly [
  'ADMIN',
  'CUSTOMER',
  'OWNER',
  'MANAGER',
  'CHEF',
  'WAITER',
];

export type PlatformRoleName = (typeof PLATFORM_ROLE_NAMES)[number];
export type RestaurantRoleName = (typeof RESTAURANT_ROLE_NAMES)[number];
export type RestaurantPermissionName =
  (typeof RESTAURANT_PERMISSION_NAMES)[number];
export type RoleName = (typeof ROLE_NAMES)[number];

export declare const ROLE_DESCRIPTIONS: Record<RoleName, string>;
export declare const isPlatformRole: (
  value: string,
) => value is PlatformRoleName;
export declare const isRestaurantRole: (
  value: string,
) => value is RestaurantRoleName;
export declare const RESTAURANT_ROLE_PERMISSIONS: Record<
  RestaurantRoleName,
  readonly RestaurantPermissionName[]
>;
export declare const restaurantPermissionsForRole: (
  role: RestaurantRoleName,
) => readonly RestaurantPermissionName[];
export declare const hasRestaurantPermissions: (
  role: RestaurantRoleName,
  requiredPermissions: readonly RestaurantPermissionName[],
) => boolean;
