import { apiClient } from '@/lib/api';
import type {
  CreateRestaurantInput,
  OpeningHour,
  RestaurantAddress,
  RestaurantAddressInput,
  RestaurantManagement,
  RestaurantMembership,
  UpdateRestaurantInput,
} from '../types/restaurant.types';

const path = (restaurantId: string) => `/restaurants/${restaurantId}`;

export const restaurantService = {
  list() {
    return apiClient.get<RestaurantMembership[]>('/restaurants');
  },

  get(restaurantId: string) {
    return apiClient.get<RestaurantManagement>(path(restaurantId));
  },

  create(input: CreateRestaurantInput) {
    return apiClient.post<RestaurantManagement>('/restaurants', input);
  },

  update(restaurantId: string, input: UpdateRestaurantInput) {
    return apiClient.patch<RestaurantManagement>(path(restaurantId), input);
  },

  replaceOpeningHours(restaurantId: string, openingHours: OpeningHour[]) {
    return apiClient.put<{ openingHours: OpeningHour[] }>(
      `${path(restaurantId)}/opening-hours`,
      { openingHours },
    );
  },

  listAddresses(restaurantId: string) {
    return apiClient.get<RestaurantAddress[]>(
      `${path(restaurantId)}/addresses`,
    );
  },

  addAddress(restaurantId: string, input: RestaurantAddressInput) {
    return apiClient.post<RestaurantAddress>(
      `${path(restaurantId)}/addresses`,
      input,
    );
  },

  updateAddress(
    restaurantId: string,
    addressId: string,
    input: Partial<RestaurantAddressInput>,
  ) {
    return apiClient.patch<RestaurantAddress>(
      `${path(restaurantId)}/addresses/${addressId}`,
      input,
    );
  },

  removeAddress(restaurantId: string, addressId: string) {
    return apiClient.delete<void>(
      `${path(restaurantId)}/addresses/${addressId}`,
    );
  },

  uploadMedia(restaurantId: string, type: 'logo' | 'cover', file: File) {
    const body = new FormData();
    body.append(type, file);
    return apiClient.post(`${path(restaurantId)}/${type}`, body);
  },

  removeMedia(restaurantId: string, type: 'logo' | 'cover') {
    return apiClient.delete<void>(`${path(restaurantId)}/${type}`);
  },
};
