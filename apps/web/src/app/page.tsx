'use client';

import { useRestaurant } from '@/providers/restaurant-provider';
import { StorefrontLanding } from '@/features/restaurant/components/storefront-landing';
import { RestaurantDiscovery } from '@/features/restaurant/components/restaurant-discovery';

export default function HomePage() {
  const { isTenantMode } = useRestaurant();

  if (isTenantMode) {
    return <StorefrontLanding />;
  }

  return <RestaurantDiscovery />;
}
