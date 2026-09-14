'use client';

import { useMutation } from '@tanstack/react-query';
import { useRestaurant } from '@/providers/restaurant-provider';
import { cartService } from '../services/cart.service';
import type { AddCartItemPayload, Cart } from '../types';

export function useAddCartItem() {
  const { restaurantId } = useRestaurant();

  return useMutation<Cart, Error, Omit<AddCartItemPayload, 'version'>>({
    mutationFn: async (item) => {
      if (!restaurantId) throw new Error('Restaurant context is required to add an item.');
      const cart = await cartService.createOrGetActive({ restaurantId });
      return cartService.addItem(cart.id, { ...item, version: cart.version });
    },
  });
}
