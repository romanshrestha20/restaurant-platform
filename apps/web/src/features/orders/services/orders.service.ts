import { api } from '@/lib/api/client';
import type { Order, OrderList } from '../types';

export interface OrderListParams {
  restaurantId: string;
  limit: number;
  offset: number;
}

export const ordersService = {
  list(params: OrderListParams) {
    return api.get<OrderList>('/customer/orders', { params });
  },

  getByNumber(orderNumber: string) {
    return api.get<Order>(`/customer/orders/by-number/${encodeURIComponent(orderNumber)}`);
  },
};
