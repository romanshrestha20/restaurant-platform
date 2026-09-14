"use client";

import { useMemo } from "react";
import { useRestaurant } from "@/providers/restaurant-provider";
import { menuService } from "../services/menu.service";

export function useMenu() {
  const restaurantContext = useRestaurant();
  const sections = useMemo(
    () =>
      restaurantContext.restaurant
        ? menuService.getSections(restaurantContext.restaurant)
        : [],
    [restaurantContext.restaurant],
  );

  return { ...restaurantContext, sections };
}
