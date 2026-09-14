"use client";

import { useQuery } from "@tanstack/react-query";
import { restaurantService } from "../services/restaurant.service";
import type { RestaurantCatalog, RestaurantSummary } from "@/types/restaurant";
import type { ApiError } from "@/lib/api/errors";

export function useRestaurantCatalog(slug: string | null | undefined) {
  return useQuery<RestaurantCatalog, ApiError>({
    queryKey: ["restaurant-catalog", slug],
    queryFn: () => {
      if (!slug) throw new Error("Restaurant slug is required");
      return restaurantService.getCatalogBySlug(slug);
    },
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRestaurantsList(params?: { lat?: number; lng?: number }) {
  return useQuery<RestaurantSummary[], ApiError>({
    queryKey: ["restaurants-list", params],
    queryFn: () => restaurantService.listRestaurants(params),
    staleTime: 2 * 60 * 1000,
  });
}
