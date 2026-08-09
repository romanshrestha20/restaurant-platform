const PLATFORM_ROLE_NAMES = ['ADMIN', 'CUSTOMER'];
const RESTAURANT_ROLE_NAMES = ['OWNER', 'MANAGER', 'CHEF', 'WAITER'];
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

module.exports = {
  PLATFORM_ROLE_NAMES,
  RESTAURANT_ROLE_NAMES,
  ROLE_NAMES,
  ROLE_DESCRIPTIONS,
  isPlatformRole,
  isRestaurantRole,
};
