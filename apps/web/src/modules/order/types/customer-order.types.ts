export type CatalogOption = { id: string; name: string; priceAdjustment: string };
export type CatalogVariant = { id: string; name: string; options: CatalogOption[] };
export type CatalogAddOn = { id: string; name: string; price: string };
export type CatalogAddOnGroup = {
  id: string;
  name: string;
  required: boolean;
  minSelection: number;
  maxSelection: number;
  addOns: CatalogAddOn[];
};
export type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  preparationTime: number | null;
  calories: number | null;
  isFeatured: boolean;
  media: Array<{ alt: string | null; media: { url: string; width: number | null; height: number | null } }>;
  variants: CatalogVariant[];
  addOnGroups: CatalogAddOnGroup[];
};
export type CustomerCatalog = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  timezone: string;
  settings: {
    estimatedPrepMinutes: number;
    minimumOrder: string;
    deliveryFee: string;
    serviceFee: string;
    taxRate: string;
  } | null;
  media: Array<{ type: 'LOGO' | 'COVER'; alt: string | null; media: { url: string } }>;
  menus: Array<{
    id: string;
    name: string;
    description: string | null;
    categories: Array<{ id: string; name: string; description: string | null; items: CatalogItem[] }>;
  }>;
};

export type CustomerCart = {
  id: string;
  restaurantId: string;
  version: number;
  currency: string;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  restaurant: { id: string; name: string; slug: string; currency: string };
  items: Array<{
    id: string;
    menuItemId: string;
    quantity: number;
    notes: string | null;
    unitPrice: string;
    totalPrice: string;
    menuItem: { id: string; name: string; status: string; media: Array<{ alt: string | null; media: { url: string } }> };
    variantOptions: Array<{ priceAdjustment: string; option: { id: string; name: string; variant: { id: string; name: string } } }>;
    addOns: Array<{ quantity: number; price: string; addOn: { id: string; name: string } }>;
  }>;
};
