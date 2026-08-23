import { apiClient } from '@/lib/api';
import type { CustomerRestaurant } from '../types/customer-restaurant.types';

export const customerRestaurantService = {
  list(location?: { latitude: number; longitude: number }) {
    const query = location ? `?lat=${location.latitude}&lng=${location.longitude}` : '';
    return apiClient.get<CustomerRestaurant[]>(`/catalog/restaurants${query}`);
  },
};
