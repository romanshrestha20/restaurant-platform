const PLATFORM_ROLE_NAMES = ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'SUPPORT', 'FINANCE', 'ADMIN'];
const RESTAURANT_ROLE_NAMES = ['OWNER', 'MANAGER', 'CHEF', 'WAITER'];
const RESTAURANT_PERMISSION_NAMES = [
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
const ROLE_NAMES = [...PLATFORM_ROLE_NAMES, ...RESTAURANT_ROLE_NAMES];

const ROLE_DESCRIPTIONS = {
  SUPER_ADMIN: 'Full platform administrator',
  PLATFORM_ADMIN: 'Platform administrator',
  SUPPORT: 'Customer and restaurant support specialist',
  FINANCE: 'Finance and payments administrator',
  ADMIN: 'Platform administrator',
  OWNER: 'Restaurant owner',
  MANAGER: 'Restaurant manager',
  CHEF: 'Kitchen staff',
  WAITER: 'Front-of-house staff',
};

const PLATFORM_ROLE_PERMISSIONS = {
  SUPER_ADMIN: RESTAURANT_PERMISSION_NAMES,
  PLATFORM_ADMIN: RESTAURANT_PERMISSION_NAMES,
  SUPPORT: ['restaurant.read', 'orders.read', 'customers.read', 'customers.update', 'staff.read', 'report.read'],
  FINANCE: ['orders.read', 'orders.refund', 'report.read'],
  ADMIN: RESTAURANT_PERMISSION_NAMES,
};
const platformPermissionsForRole = (role) => PLATFORM_ROLE_PERMISSIONS[role] ?? [];
const hasPlatformPermissions = (roles, requiredPermissions) =>
  requiredPermissions.every((permission) =>
    roles.some((role) => platformPermissionsForRole(role).includes(permission)),
  );

const isPlatformRole = (value) => PLATFORM_ROLE_NAMES.includes(value);
const isRestaurantRole = (value) => RESTAURANT_ROLE_NAMES.includes(value);
const RESTAURANT_ROLE_PERMISSIONS = {
  OWNER: RESTAURANT_PERMISSION_NAMES,
  MANAGER: RESTAURANT_PERMISSION_NAMES,
  CHEF: ['restaurant.read', 'menu.read', 'menu.create', 'menu.update', 'orders.read', 'orders.update'],
  WAITER: ['restaurant.read', 'menu.read', 'orders.read', 'orders.update', 'reservations.read', 'reservations.update', 'customers.read'],
};
const restaurantPermissionsForRole = (role) =>
  RESTAURANT_ROLE_PERMISSIONS[role] ?? [];
const hasRestaurantPermissions = (role, requiredPermissions) =>
  requiredPermissions.every((permission) =>
    restaurantPermissionsForRole(role).includes(permission),
  );

module.exports = {
  PLATFORM_ROLE_NAMES,
  RESTAURANT_ROLE_NAMES,
  RESTAURANT_PERMISSION_NAMES,
  RESTAURANT_ROLE_PERMISSIONS,
  ROLE_NAMES,
  ROLE_DESCRIPTIONS,
  isPlatformRole,
  isRestaurantRole,
  restaurantPermissionsForRole,
  hasRestaurantPermissions,
  PLATFORM_ROLE_PERMISSIONS,
  platformPermissionsForRole,
  hasPlatformPermissions,
};
