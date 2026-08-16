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

// ─── Order types ───────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type OrderDeliveryAddress = {
  street: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
};

export type OrderItemSummary = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  variantOptions: Array<{ name: string; priceAdjustment: string }>;
  addOns: Array<{ name: string; quantity: number; price: string }>;
};

export type OrderHistoryEntry = {
  id: string;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  changedBy: { id: string; profile: { firstName: string; lastName: string } | null } | null;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  notes: string | null;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    phone: string | null;
    addresses: Array<{ street: string; city: string; country: string; isPrimary: boolean }>;
  };
  table: { id: string; tableNumber: string; capacity: number } | null;
  deliveryAddress: OrderDeliveryAddress | null;
  items: OrderItemSummary[];
  payment: {
    id: string;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: string;
    paidAt: string | null;
  } | null;
  history: OrderHistoryEntry[];
};

export type CheckoutInput = {
  restaurantId: string;
  type: OrderType;
  tableNumber?: string;
  tableId?: string;
  deliveryAddressId?: string;
  deliveryAddress?: OrderDeliveryAddress;
  notes?: string | null;
  paymentMethod: PaymentMethod;
  couponCode?: string;
};
