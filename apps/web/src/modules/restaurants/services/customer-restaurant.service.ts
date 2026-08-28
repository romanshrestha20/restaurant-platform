import { apiClient } from '@/lib/api';
import { CURATED_RESTAURANTS } from '../data/curated-restaurants';
import type { CustomerRestaurant } from '../types/customer-restaurant.types';

export const customerRestaurantService = {
  async list(location?: { latitude: number; longitude: number }): Promise<CustomerRestaurant[]> {
    const query = location ? `?lat=${location.latitude}&lng=${location.longitude}` : '';
    try {
      const serverRestaurants = await apiClient.get<CustomerRestaurant[]>(`/catalog/restaurants${query}`);
      if (serverRestaurants && serverRestaurants.length > 0) {
        // Merge with curated list without duplicates
        const existingIds = new Set(serverRestaurants.map((r) => r.id));
        const nonDuplicateCurated = CURATED_RESTAURANTS.filter((r) => !existingIds.has(r.id) && !existingIds.has(r.slug));
        return [...serverRestaurants, ...nonDuplicateCurated];
      }
      return CURATED_RESTAURANTS;
    } catch {
      return CURATED_RESTAURANTS;
    }
  },
};
