import type { PaginatedResponse } from "@/lib/api";

export type MenuItemStatus = "AVAILABLE" | "UNAVAILABLE" | "HIDDEN";
export type MenuCategoryStatus = "ACTIVE" | "INACTIVE";

export type RestaurantMenu = {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { categories: number };
};

export type MenuCategory = {
  id: string;
  restaurantId: string;
  menuId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  status: MenuCategoryStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { menuItems: number };
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  sku: string | null;
  basePrice: string | number;
  preparationTime: number | null;
  calories: number | null;
  isFeatured: boolean;
  sortOrder: number;
  status: MenuItemStatus;
  createdAt: string;
  updatedAt: string;
  media: Array<{
    mediaId?: string;
    alt: string | null;
    media: { url: string; width: number | null; height: number | null };
  }>;
};

export type VariantOption = {
  id: string;
  name: string;
  priceAdjustment: string | number;
};

export type MenuItemVariant = {
  id: string;
  name: string;
  sortOrder: number;
  options: VariantOption[];
};

export type AddOn = {
  id: string;
  name: string;
  price: string | number;
  sortOrder: number;
  isAvailable: boolean;
};

export type AddOnGroup = {
  id: string;
  name: string;
  required: boolean;
  minSelection: number;
  maxSelection: number;
  addOns: AddOn[];
};

export type MenuItemConfiguration = MenuItem & {
  variants: MenuItemVariant[];
  addOnGroups: AddOnGroup[];
};

export type MenuListResponse = PaginatedResponse<RestaurantMenu>;
export type MenuCategoryListResponse = PaginatedResponse<MenuCategory>;
export type MenuItemListResponse = PaginatedResponse<MenuItem>;

export type MenuItemInput = {
  categoryId: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  price: number;
  preparationTime?: number | null;
  calories?: number | null;
  isFeatured?: boolean;
  sortOrder?: number;
  status?: MenuItemStatus;
};
