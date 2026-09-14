import { api } from '@/lib/api/client';
import type { AddCartItemPayload, Cart, CreateCartPayload, RevalidateCartResponse, UpdateCartItemPayload } from '../types';

export const cartService = {
  createOrGetActive(payload: CreateCartPayload) {
    return api.post<Cart>('/customer/carts', payload);
  },

  getCurrent(restaurantId: string) {
    return api.get<Cart | null>('/customer/carts/current', { params: { restaurantId } });
  },

  addItem(cartId: string, payload: AddCartItemPayload) {
    return api.post<Cart>(`/customer/carts/${encodeURIComponent(cartId)}/items`, payload);
  },

  updateItem(cartId: string, cartItemId: string, payload: UpdateCartItemPayload) {
    return api.patch<Cart>(`/customer/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(cartItemId)}`, payload);
  },

  removeItem(cartId: string, cartItemId: string, version: number) {
    return api.delete<Cart>(`/customer/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(cartItemId)}`, { params: { version } });
  },

  clear(cartId: string) {
    return api.delete<void>(`/customer/carts/${encodeURIComponent(cartId)}`);
  },

  revalidate(cartId: string, version: number) {
    return api.post<RevalidateCartResponse>(`/customer/carts/${encodeURIComponent(cartId)}/revalidate`, { version });
  },
};
