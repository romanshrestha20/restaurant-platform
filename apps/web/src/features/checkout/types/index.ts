import type { OrderType, PaymentMethod } from '@/features/orders/types';

/** Order types a customer can choose on the storefront. Dine-in needs a table and is not offered here. */
export type FulfilmentType = Extract<OrderType, 'TAKEAWAY' | 'DELIVERY'>;

/** Body of POST /customer/orders/checkout. */
export interface CheckoutInput {
  restaurantId: string;
  type: FulfilmentType;
  deliveryAddressId?: string;
  notes?: string | null;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  tipPercentage?: number;
}

/** Response of GET /customer/orders/delivery-quote. */
export interface DeliveryQuote {
  deliveryAvailable: boolean;
  deliveryFee: string;
  minimumOrder: string;
  estimatedDeliveryMinutes: number | null;
  deliveryRadiusKm: string;
  distanceKm: number | null;
}
