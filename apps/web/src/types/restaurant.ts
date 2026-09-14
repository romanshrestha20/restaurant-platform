export interface RestaurantMediaItem {
  type: string;
  alt: string | null;
  media: {
    url: string;
    width?: number | null;
    height?: number | null;
  };
}

export interface RestaurantSettings {
  estimatedPrepMinutes?: number;
  minimumOrder?: string | number;
  deliveryFee?: string | number;
  serviceFee?: string | number;
  taxRate?: string | number;
  deliveryRadiusKm?: number;
}

export interface RestaurantAddressSummary {
  city: string;
  country: string;
}

export interface RestaurantSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  settings: RestaurantSettings | null;
  media: RestaurantMediaItem[];
  addresses: RestaurantAddressSummary[];
  distanceKm?: number | null;
  deliveryRadiusKm?: number;
  deliveryFee?: number;
  minimumOrder?: number;
  deliveryAvailable?: boolean;
  itemCount?: number;
}

export interface VariantOption {
  id: string;
  name: string;
  priceAdjustment: string;
}

export interface MenuItemVariant {
  id: string;
  name: string;
  options: VariantOption[];
}

export interface AddOn {
  id: string;
  name: string;
  price: string;
}

export interface AddOnGroup {
  id: string;
  name: string;
  required: boolean;
  minSelection: number;
  maxSelection: number;
  addOns: AddOn[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  preparationTime: number | null;
  calories: number | null;
  isFeatured: boolean;
  media: RestaurantMediaItem[];
  variants: MenuItemVariant[];
  addOnGroups: AddOnGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  items: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  description: string | null;
  categories: MenuCategory[];
}

export interface RestaurantCatalog {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  timezone: string;
  settings: RestaurantSettings | null;
  media: RestaurantMediaItem[];
  menus: Menu[];
}
