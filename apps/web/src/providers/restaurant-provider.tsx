"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { resolveDomain, type DomainResolution } from "@/lib/restaurant/domain";
import { useRestaurantCatalog } from "@/features/restaurant/hooks/use-restaurant";
import type { RestaurantCatalog, RestaurantSettings } from "@/types/restaurant";
import type { ApiError } from "@/lib/api/errors";

export interface RestaurantContextValue {
  restaurant: RestaurantCatalog | null;
  restaurantId: string | null;
  slug: string | null;
  currency: string;
  settings: RestaurantSettings | null;
  isTenantMode: boolean;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => void;
  resolution: DomainResolution | null;
  setDevSlug: (slug: string | null) => void;
}

const RestaurantContext = createContext<RestaurantContextValue | undefined>(
  undefined,
);

interface RestaurantProviderProps {
  children: ReactNode;
  initialHostname?: string;
  initialSlug?: string;
}

export function RestaurantProvider({
  children,
  initialHostname,
  initialSlug,
}: RestaurantProviderProps) {
  const searchParams = useSearchParams();
  const querySlug = searchParams?.get("restaurant") || null;

  const [devSlug, setDevSlug] = useState<string | null>(initialSlug || null);
  const [hostname, setHostname] = useState<string>(
    initialHostname || "localhost",
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname);
    }
  }, []);

  const activeSlugOverride = querySlug || devSlug;

  const resolution = useMemo(() => {
    return resolveDomain(hostname, activeSlugOverride);
  }, [hostname, activeSlugOverride]);

  const slugToFetch = resolution.type === "tenant" ? resolution.slug : null;

  const {
    data: restaurant,
    isLoading,
    isError,
    error,
    refetch,
  } = useRestaurantCatalog(slugToFetch);

  const value = useMemo<RestaurantContextValue>(() => {
    return {
      restaurant: restaurant || null,
      restaurantId: restaurant?.id || null,
      slug: restaurant?.slug || slugToFetch || null,
      currency: restaurant?.currency || "EUR",
      settings: restaurant?.settings || null,
      isTenantMode: resolution.type === "tenant",
      isLoading: resolution.type === "tenant" ? isLoading : false,
      isError: resolution.type === "tenant" ? isError : false,
      error: error || null,
      refetch,
      resolution,
      setDevSlug,
    };
  }, [restaurant, slugToFetch, resolution, isLoading, isError, error, refetch]);

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant(): RestaurantContextValue {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}
