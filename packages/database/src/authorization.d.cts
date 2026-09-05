export declare const PLATFORM_ROLE_NAMES: readonly ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT', 'FINANCE', 'ADMIN'];
export declare const RESTAURANT_ROLE_NAMES: readonly [
  'OWNER',
  'MANAGER',
  'CHEF',
  'WAITER',
];
export declare const RESTAURANT_PERMISSION_NAMES: readonly [
  'restaurant.read',
  'restaurant.create',
  'restaurant.update',
  'restaurant.delete',
  'menu.read',
  'menu.create',
  'menu.update',
  'menu.delete',
  'orders.read',
  'orders.update',
  'orders.refund',
  'reservations.read',
  'reservations.update',
  'customers.read',
  'customers.update',
  'customers.suspend',
  'staff.read',
  'staff.invite',
  'staff.update',
  'staff.remove',
  'staff.manage',
  'report.read',
];
export declare const ROLE_NAMES: readonly [
  'ADMIN',
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
export declare const PLATFORM_ROLE_PERMISSIONS: Record<PlatformRoleName, readonly RestaurantPermissionName[]>;
export declare const platformPermissionsForRole: (role: PlatformRoleName) => readonly RestaurantPermissionName[];
export declare const hasPlatformPermissions: (roles: readonly PlatformRoleName[], requiredPermissions: readonly RestaurantPermissionName[]) => boolean;
