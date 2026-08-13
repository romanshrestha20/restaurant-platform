import type { ReactNode } from 'react';
import { RestaurantShell } from '@/modules/restaurants/components/restaurant-shell';

export default function RestaurantsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <RestaurantShell>{children}</RestaurantShell>;
}
