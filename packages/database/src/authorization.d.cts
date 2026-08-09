export declare const PLATFORM_ROLE_NAMES: readonly ['ADMIN', 'CUSTOMER'];
export declare const RESTAURANT_ROLE_NAMES: readonly [
  'OWNER',
  'MANAGER',
  'CHEF',
  'WAITER',
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
export type RoleName = (typeof ROLE_NAMES)[number];

export declare const ROLE_DESCRIPTIONS: Record<RoleName, string>;
export declare const isPlatformRole: (
  value: string,
) => value is PlatformRoleName;
export declare const isRestaurantRole: (
  value: string,
) => value is RestaurantRoleName;
