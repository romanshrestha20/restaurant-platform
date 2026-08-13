export type RestaurantRole = 'OWNER' | 'MANAGER' | 'CHEF' | 'WAITER';
export type RestaurantPermission =
  | 'restaurant.read'
  | 'restaurant.update'
  | 'menu.read'
  | 'menu.create'
  | 'menu.update'
  | 'menu.delete'
  | 'orders.read'
  | 'orders.update'
  | 'reservations.read'
  | 'reservations.update'
  | 'customers.read'
  | 'staff.read'
  | 'staff.manage';
export type RestaurantStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED';
export type RestaurantMediaType = 'LOGO' | 'COVER';
export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type RestaurantAddress = {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  latitude: string | number | null;
  longitude: string | number | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RestaurantMedia = {
  type: RestaurantMediaType;
  alt: string | null;
  media: {
    url: string;
    publicId?: string;
    fileName?: string;
    mimeType?: string;
    width: number | null;
    height: number | null;
    size?: number;
    createdAt?: string;
  };
};

export type RestaurantSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  timezone: string;
  isActive: boolean;
  status: RestaurantStatus;
  addresses: RestaurantAddress[];
  media: RestaurantMedia[];
  createdAt: string;
  updatedAt: string;
};

export type RestaurantMembership = {
  joinedAt: string;
  callerRole: RestaurantRole;
  callerPermissions: RestaurantPermission[];
  restaurant: RestaurantSummary;
};

export type OpeningHour = {
  id?: string;
  day: DayOfWeek;
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
};

export type RestaurantManagement = Omit<RestaurantSummary, 'media'> & {
  email: string | null;
  phone: string | null;
  callerRole: RestaurantRole;
  callerPermissions: RestaurantPermission[];
  openingHours: OpeningHour[];
  media: RestaurantMedia[];
  settings: {
    acceptsOrders: boolean;
    acceptsReservations: boolean;
    autoAcceptOrders: boolean;
    estimatedPrepMinutes: number;
    minimumOrder: string | number;
    deliveryFee: string | number;
    serviceFee: string | number;
    taxRate: string | number;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type RestaurantAddressInput = {
  label: string;
  street: string;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  isPrimary?: boolean;
};

export type CreateRestaurantInput = {
  name: string;
  slug?: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  currency?: string;
  timezone?: string;
  primaryAddress: Omit<RestaurantAddressInput, 'isPrimary'>;
  openingHours?: OpeningHour[];
};

export type UpdateRestaurantInput = Partial<
  Pick<
    RestaurantManagement,
    'name' | 'description' | 'email' | 'phone' | 'currency' | 'timezone'
  >
>;
