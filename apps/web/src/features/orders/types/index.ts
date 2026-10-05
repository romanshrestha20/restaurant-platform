export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY'
  | 'STRIPE'
  | 'PAYTRAIL'
  | 'KLARNA';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export interface OrderItemVariantOption {
  id: string;
  name: string;
  variantName: string | null;
  priceAdjustment: string;
}

export interface OrderItemAddOn {
  id: string;
  name: string;
  groupName: string | null;
  quantity: number;
  price: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  variantOptions: OrderItemVariantOption[];
  addOns: OrderItemAddOn[];
}

export interface OrderPayment {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: string;
  currency: string;
  paidAt: string | null;
}

export interface OrderStatusHistoryEntry {
  id: string;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
}

export interface OrderDeliveryAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

/** Captured at checkout so receipts stay correct after restaurant settings change. */
export interface OrderRestaurantSnapshot {
  delivery: { fee: string } | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  type: OrderType;
  status: OrderStatus;
  notes: string | null;
  subtotal: string;
  tax: string;
  discount: string;
  tip: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    phone: string | null;
  };
  table: { id: string; tableNumber: string } | null;
  deliveryAddress: OrderDeliveryAddress | null;
  restaurantSnapshot: OrderRestaurantSnapshot | null;
  items: OrderItem[];
  payment: OrderPayment | null;
  /** Newest first. */
  history: OrderStatusHistoryEntry[];
}

export interface OrderList {
  items: Order[];
  total: number;
  limit: number;
  offset: number;
}
