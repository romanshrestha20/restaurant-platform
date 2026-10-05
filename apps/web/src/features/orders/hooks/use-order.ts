'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { ApiError } from '@/lib/api/errors';
import { ordersService } from '../services/orders.service';
import type { Order } from '../types';

/** Orders are scoped to the signed-in customer; the auth provider clears ['orders'] on sign-out. */
export const orderKeys = {
  all: ['orders'] as const,
  byNumber: (orderNumber: string) => ['orders', 'by-number', orderNumber] as const,
};

export function useOrderByNumber(orderNumber: string | null) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  return useQuery<Order, ApiError>({
    queryKey: orderKeys.byNumber(orderNumber ?? ''),
    queryFn: () => ordersService.getByNumber(orderNumber!),
    enabled: Boolean(orderNumber) && isAuthenticated && !isAuthLoading,
  });
}
