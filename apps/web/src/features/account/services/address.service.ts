import { api } from '@/lib/api/client';
import type { Address, AddressSearchResult, CreateAddressInput } from '../types';

export const addressService = {
  list() {
    return api.get<Address[]>('/profile/addresses');
  },

  search(query: string) {
    return api.get<AddressSearchResult[]>('/profile/addresses/search', { params: { q: query } });
  },

  create(input: CreateAddressInput) {
    return api.post<Address>('/profile/addresses', input);
  },
};
