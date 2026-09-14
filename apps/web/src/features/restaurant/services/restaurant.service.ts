import { api } from '@/lib/api/client';
import type { RestaurantCatalog, RestaurantSummary } from '@/types/restaurant';

export const restaurantService = {
  /**
   * Fetches the complete catalog (restaurant info, settings, menus, items) for a given slug.
   */
  async getCatalogBySlug(slug: string): Promise<RestaurantCatalog> {
    return api.get<RestaurantCatalog>(`/catalog/restaurants/${encodeURIComponent(slug)}`);
  },

  /**
   * Lists all active restaurants accepting orders (for discovery).
   */
  async listRestaurants(params?: { lat?: number; lng?: number }): Promise<RestaurantSummary[]> {
    const searchParams = new URLSearchParams();
    if (params?.lat != null) searchParams.set('lat', params.lat.toString());
    if (params?.lng != null) searchParams.set('lng', params.lng.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/catalog/restaurants?${queryString}` : '/catalog/restaurants';
    return api.get<RestaurantSummary[]>(endpoint);
  },
};
