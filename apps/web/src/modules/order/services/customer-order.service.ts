import { apiClient } from '@/lib/api';
import type { CustomerCart, CustomerCatalog } from '../types/customer-order.types';

export const customerOrderService = {
  catalog(slug: string) {
    return apiClient.get<CustomerCatalog>(`/catalog/restaurants/${encodeURIComponent(slug)}`);
  },
  currentCart(restaurantId: string) {
    return apiClient.get<CustomerCart | null>(`/customer/carts/current?restaurantId=${encodeURIComponent(restaurantId)}`);
  },
  createCart(restaurantId: string) {
    return apiClient.post<CustomerCart>('/customer/carts', { restaurantId });
  },
  addItem(cartId: string, input: {
    menuItemId: string;
    quantity: number;
    version: number;
    variantOptionIds: string[];
    addOns: Array<{ addOnId: string; quantity: number }>;
    notes?: string | null;
  }) {
    return apiClient.post<CustomerCart>(`/customer/carts/${cartId}/items`, input);
  },
  updateItem(cartId: string, cartItemId: string, input: { quantity?: number; notes?: string | null; version: number }) {
    return apiClient.patch<CustomerCart>(`/customer/carts/${cartId}/items/${cartItemId}`, input);
  },
  removeItem(cartId: string, cartItemId: string, version: number) {
    return apiClient.delete<CustomerCart>(`/customer/carts/${cartId}/items/${cartItemId}?version=${version}`);
  },
  clear(cartId: string) {
    return apiClient.delete<void>(`/customer/carts/${cartId}`);
  },
  revalidate(cartId: string, version: number) {
    return apiClient.post<{ cart: CustomerCart; changes: unknown[] }>(`/customer/carts/${cartId}/revalidate`, { version });
  },
};
