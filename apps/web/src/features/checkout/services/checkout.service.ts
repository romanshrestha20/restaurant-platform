import { api } from '@/lib/api/client';
import type { Order } from '@/features/orders/types';
import type { CheckoutInput, DeliveryQuote } from '../types';

export const checkoutService = {
  placeOrder(input: CheckoutInput) {
    return api.post<Order>('/customer/orders/checkout', input);
  },

  getDeliveryQuote(restaurantId: string, addressId: string) {
    return api.get<DeliveryQuote>('/customer/orders/delivery-quote', {
      params: { restaurantId, addressId },
    });
  },
};
