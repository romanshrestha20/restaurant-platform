'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartKey } from '@/features/cart/hooks/use-cart';
import { orderKeys } from '@/features/orders/hooks/use-order';
import type { Order } from '@/features/orders/types';
import type { ApiError } from '@/lib/api/errors';
import { useRestaurant } from '@/providers/restaurant-provider';
import { checkoutService } from '../services/checkout.service';
import type { CheckoutInput, DeliveryQuote } from '../types';

export function useDeliveryQuote(addressId: string | null) {
  const { restaurantId } = useRestaurant();

  return useQuery<DeliveryQuote, ApiError>({
    queryKey: ['checkout', 'delivery-quote', restaurantId, addressId],
    queryFn: () => checkoutService.getDeliveryQuote(restaurantId!, addressId!),
    enabled: Boolean(restaurantId && addressId),
  });
}

export function usePlaceOrder() {
  const { restaurantId } = useRestaurant();
  const queryClient = useQueryClient();

  return useMutation<Order, ApiError, Omit<CheckoutInput, 'restaurantId'>>({
    mutationFn: (input) => {
      if (!restaurantId) throw new Error('Restaurant context is required to place an order.');
      return checkoutService.placeOrder({ ...input, restaurantId });
    },
    onSuccess: (order) => {
      // The API checks the cart out, so the cached copy is stale.
      queryClient.setQueryData(orderKeys.byNumber(order.orderNumber), order);
      void queryClient.invalidateQueries({ queryKey: orderKeys.all });
      if (restaurantId) void queryClient.invalidateQueries({ queryKey: cartKey(restaurantId) });
    },
    onError: (error) => {
      // 409: the cart changed or was already checked out elsewhere.
      if (error.statusCode === 409 && restaurantId) {
        void queryClient.invalidateQueries({ queryKey: cartKey(restaurantId) });
      }
    },
  });
}
