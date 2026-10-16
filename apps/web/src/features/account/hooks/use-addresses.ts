'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { ApiError } from '@/lib/api/errors';
import { addressService } from '../services/address.service';
import type { Address, AddressSearchResult, CreateAddressInput } from '../types';

/** Addresses belong to the customer, not the restaurant, so the key is not tenant-scoped. */
export const addressesKey = ['account', 'addresses'] as const;

export function useAddresses() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  return useQuery<Address[], ApiError>({
    queryKey: addressesKey,
    queryFn: () => addressService.list(),
    enabled: isAuthenticated && !isAuthLoading,
  });
}

/** The API ignores queries shorter than three characters, so don't send them. */
export function useAddressSearch(query: string) {
  const trimmed = query.trim();

  return useQuery<AddressSearchResult[], ApiError>({
    queryKey: ['account', 'address-search', trimmed],
    queryFn: () => addressService.search(trimmed),
    enabled: trimmed.length >= 3,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation<Address, ApiError, CreateAddressInput>({
    mutationFn: (input) => addressService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressesKey }),
  });
}
