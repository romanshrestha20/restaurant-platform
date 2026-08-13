'use client';

import { usePathname } from 'next/navigation';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useRestaurants } from '../hooks/use-restaurants';
import type { RestaurantMembership } from '../types/restaurant.types';

type ActiveRestaurantContextValue = {
  activeMembership: RestaurantMembership | null;
  activeRestaurantId: string | null;
  memberships: RestaurantMembership[];
  refresh: () => Promise<RestaurantMembership[]>;
  status: 'loading' | 'ready' | 'error';
};

const ActiveRestaurantContext =
  createContext<ActiveRestaurantContextValue | null>(null);

export function ActiveRestaurantProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { refresh, restaurants: memberships, status } = useRestaurants();
  const activeRestaurantId = useMemo(() => {
    const match = pathname.match(/^\/restaurants\/([^/]+)/);
    return match?.[1] && match[1] !== 'new' ? match[1] : null;
  }, [pathname]);
  const activeMembership =
    memberships.find(
      ({ restaurant }) => restaurant.id === activeRestaurantId,
    ) ?? null;

  return (
    <ActiveRestaurantContext.Provider
      value={{
        activeMembership,
        activeRestaurantId,
        memberships,
        refresh,
        status,
      }}
    >
      {children}
    </ActiveRestaurantContext.Provider>
  );
}

export function useActiveRestaurant() {
  const context = useContext(ActiveRestaurantContext);
  if (!context) {
    throw new Error(
      'useActiveRestaurant must be used within ActiveRestaurantProvider.',
    );
  }
  return context;
}
