'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { RestaurantShell } from '@/modules/restaurants/components/restaurant-shell';

export default function RestaurantsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  return pathname === '/restaurants' ? children : <RestaurantShell>{children}</RestaurantShell>;
}
