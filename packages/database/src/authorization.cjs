const PLATFORM_ROLE_NAMES = ['ADMIN', 'CUSTOMER'];
const RESTAURANT_ROLE_NAMES = ['OWNER', 'MANAGER', 'CHEF', 'WAITER'];
const RESTAURANT_PERMISSION_NAMES = [
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
const ROLE_NAMES = [...PLATFORM_ROLE_NAMES, ...RESTAURANT_ROLE_NAMES];

const ROLE_DESCRIPTIONS = {
  ADMIN: 'Platform administrator',
  CUSTOMER: 'Restaurant customer',
  OWNER: 'Restaurant owner',
  MANAGER: 'Restaurant manager',
  CHEF: 'Kitchen staff',
  WAITER: 'Front-of-house staff',
};

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
};
