'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/lib/api/errors';
import { useRestaurant } from '@/providers/restaurant-provider';
import { ordersService } from '../services/orders.service';
import type { Order, OrderList } from '../types';

export const ORDERS_PAGE_SIZE = 10;

/**
 * Orders are scoped to the signed-in customer; the auth provider clears ['orders'] on sign-out.
 * Keys include the restaurant so one storefront never shows another's cached orders.
 */
export const orderKeys = {
  all: ['orders'] as const,
  list: (restaurantId: string, page: number) => ['orders', 'list', restaurantId, page] as const,
  byNumber: (restaurantId: string, orderNumber: string) => ['orders', 'by-number', restaurantId, orderNumber] as const,
};

export function useCustomerOrders(page: number) {
  const { restaurantId } = useRestaurant();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  return useQuery<OrderList, ApiError>({
    queryKey: orderKeys.list(restaurantId ?? 'none', page),
    queryFn: () =>
      ordersService.list({
        restaurantId: restaurantId!,
        limit: ORDERS_PAGE_SIZE,
        offset: page * ORDERS_PAGE_SIZE,
      }),
    enabled: Boolean(restaurantId) && isAuthenticated && !isAuthLoading,
    placeholderData: keepPreviousData,
  });
}

export function useOrderByNumber(orderNumber: string | null) {
  const { restaurantId } = useRestaurant();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  return useQuery<Order, ApiError>({
    queryKey: orderKeys.byNumber(restaurantId ?? 'none', orderNumber ?? ''),
    queryFn: async () => {
      const order = await ordersService.getByNumber(orderNumber!);
      // The customer may own orders from other restaurants; this storefront only shows its own.
      if (order.restaurantId !== restaurantId) {
        throw new ApiError({ statusCode: 404, message: 'Order not found', error: 'Not Found' });
      }
      return order;
    },
    enabled: Boolean(orderNumber && restaurantId) && isAuthenticated && !isAuthLoading,
  });
}
