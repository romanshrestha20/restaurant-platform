'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRestaurant } from '@/providers/restaurant-provider';
import { ApiError } from '@/lib/api/errors';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cartService } from '../services/cart.service';
import type { AddCartItemPayload, Cart } from '../types';

export function useAddCartItem() {
  const { restaurantId } = useRestaurant();
  const queryClient = useQueryClient();

  return useMutation<Cart, ApiError, Omit<AddCartItemPayload, 'version'>>({
    mutationFn: async (item) => {
      if (!restaurantId) throw new Error('Restaurant context is required to add an item.');
      const cart = await cartService.createOrGetActive({ restaurantId });
      return cartService.addItem(cart.id, { ...item, version: cart.version });
    },
    onSuccess: (cart) => {
      queryClient.setQueryData<Cart>(cartKey(cart.restaurantId), cart);
    },
    onError: (error) => {
      if (error.statusCode === 409 && restaurantId) {
        void queryClient.invalidateQueries({ queryKey: cartKey(restaurantId) });
      }
    },
  });
}

export const cartKey = (restaurantId: string) => ['cart', 'current', restaurantId] as const;

export function useCurrentCart() {
  const { restaurantId } = useRestaurant();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  return useQuery<Cart | null, ApiError>({
    queryKey: restaurantId ? cartKey(restaurantId) : ['cart', 'current', 'none'],
    queryFn: async () => {
      if (!restaurantId) return null;
      const cart = await cartService.getCurrent(restaurantId);
      // The API is authoritative, but reject a mismatched tenant response so
      // the UI never presents one restaurant's cart on another storefront.
      if (cart && cart.restaurantId !== restaurantId) {
        throw new ApiError({
          statusCode: 409,
          message: 'This cart belongs to a different restaurant.',
          error: 'CartRestaurantMismatch',
        });
      }
      return cart;
    },
    enabled: Boolean(restaurantId) && isAuthenticated && !isAuthLoading,
  });
}

function useCartMutation<TVariables>(
  mutationFn: (cart: Cart, variables: TVariables) => Promise<Cart>,
) {
  const { restaurantId } = useRestaurant();
  const queryClient = useQueryClient();

  return useMutation<Cart, ApiError, TVariables>({
    mutationFn: async (variables) => {
      if (!restaurantId) {
        throw new ApiError({ statusCode: 404, message: 'Restaurant not found.', error: 'RestaurantNotFound' });
      }
      const cart = queryClient.getQueryData<Cart | null>(cartKey(restaurantId));
      if (!cart) {
        throw new ApiError({ statusCode: 404, message: 'Your active cart is unavailable.', error: 'CartNotFound' });
      }
      return mutationFn(cart, variables);
    },
    onSuccess: (cart) => queryClient.setQueryData<Cart>(cartKey(cart.restaurantId), cart),
    onError: (error) => {
      if (error.statusCode === 409 && restaurantId) {
        void queryClient.invalidateQueries({ queryKey: cartKey(restaurantId) });
      }
    },
  });
}

export function useUpdateCartItem() {
  return useCartMutation<{ cartItemId: string; quantity: number }>((cart, variables) =>
    cartService.updateItem(cart.id, variables.cartItemId, {
      quantity: variables.quantity,
      version: cart.version,
    }),
  );
}

export function useRemoveCartItem() {
  return useCartMutation<{ cartItemId: string }>((cart, variables) =>
    cartService.removeItem(cart.id, variables.cartItemId, cart.version),
  );
}

export function useRevalidateCart() {
  return useCartMutation<void>(async (cart) => {
    const result = await cartService.revalidate(cart.id, cart.version);
    return result.cart;
  });
}
