'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useRestaurants } from '../hooks/use-restaurants';
import { canRestaurant } from '../permissions/restaurant-permissions';
import type {
  RestaurantMembership,
  RestaurantPermission,
} from '../types/restaurant.types';

type ActiveRestaurantContextValue = {
  currentRestaurant: RestaurantMembership['restaurant'] | null;
  currentRestaurantId: string | null;
  membership: RestaurantMembership | null;
  permissions: readonly RestaurantPermission[];
  restaurants: RestaurantMembership[];
  switchRestaurant: (restaurantId: string) => void;
  refreshRestaurant: () => Promise<RestaurantMembership[]>;
  can: (permission: RestaurantPermission) => boolean;
  /** @deprecated Use membership. */
  activeMembership: RestaurantMembership | null;
  /** @deprecated Use currentRestaurantId. */
  activeRestaurantId: string | null;
  /** @deprecated Use restaurants. */
  memberships: RestaurantMembership[];
  /** @deprecated Use refreshRestaurant. */
  refresh: () => Promise<RestaurantMembership[]>;
  status: 'loading' | 'ready' | 'error';
};

const ActiveRestaurantContext =
  createContext<ActiveRestaurantContextValue | null>(null);

export function RestaurantWorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { refresh, restaurants: memberships, status } = useRestaurants();
  const activeRestaurantId = useMemo(() => {
    const match = pathname.match(/^\/restaurants\/([^/]+)/);
    return match?.[1] && match[1] !== 'new' ? match[1] : null;
  }, [pathname]);
  const activeMembership =
    memberships.find(
      ({ restaurant }) => restaurant.id === activeRestaurantId,
    ) ?? null;
  const switchRestaurant = useCallback(
    (restaurantId: string) => router.push(`/restaurants/${restaurantId}`),
    [router],
  );
  const can = useCallback(
    (permission: RestaurantPermission) =>
      canRestaurant(activeMembership, permission),
    [activeMembership],
  );

  return (
    <ActiveRestaurantContext.Provider
      value={{
        currentRestaurant: activeMembership?.restaurant ?? null,
        currentRestaurantId: activeRestaurantId,
        membership: activeMembership,
        permissions: activeMembership?.callerPermissions ?? [],
        restaurants: memberships,
        switchRestaurant,
        refreshRestaurant: refresh,
        can,
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

/** @deprecated Use RestaurantWorkspaceProvider. */
export const ActiveRestaurantProvider = RestaurantWorkspaceProvider;

export function useActiveRestaurant() {
  const context = useContext(ActiveRestaurantContext);
  if (!context) {
    throw new Error(
      'useActiveRestaurant must be used within ActiveRestaurantProvider.',
    );
  }
  return context;
}
