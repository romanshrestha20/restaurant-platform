import { apiClient } from "./client";

export type Restaurant = {
  id: string;
  name: string;
  slug?: string;
  status?: string;
};

export type RestaurantMembership = {
  createdAt: string;
  callerRole: string;
  callerPermissions: string[];
  restaurant: Restaurant;
};

export const restaurantsApi = {
  list: () => apiClient.get<RestaurantMembership[]>("/restaurants").then(({ data }) => data),
  get: (restaurantId: string) => apiClient.get<Restaurant>(`/restaurants/${restaurantId}`).then(({ data }) => data),
};
