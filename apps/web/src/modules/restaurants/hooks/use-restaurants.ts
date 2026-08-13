'use client';

import { useCallback, useEffect, useState } from 'react';
import { restaurantService } from '../services/restaurant.service';
import type { RestaurantMembership } from '../types/restaurant.types';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<RestaurantMembership[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await restaurantService.list();
      setRestaurants(result);
      setStatus('ready');
      return result;
    } catch (error) {
      setStatus('error');
      throw error;
    }
  }, []);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return { refresh, restaurants, status };
}
