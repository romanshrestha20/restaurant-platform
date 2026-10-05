import { api } from '@/lib/api/client';
import type { Order } from '../types';

export const ordersService = {
  getByNumber(orderNumber: string) {
    return api.get<Order>(`/customer/orders/by-number/${encodeURIComponent(orderNumber)}`);
  },
};
