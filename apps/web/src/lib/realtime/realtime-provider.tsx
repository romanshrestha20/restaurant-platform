'use client';

import { useEffect, type ReactNode } from 'react';
import { authService } from '@/modules/auth/services/auth.service';
import {
  authStore,
  clearAuthStore,
  setAuthSession,
} from '@/modules/auth/store/auth.store';
import { realtimeClient } from './realtime-client';

export function RealtimeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let active = true;
    let refreshing = false;

    const syncConnection = () => {
      const { accessToken, status } = authStore.getState();
      realtimeClient.setAccessToken(accessToken);
      if (status === 'authenticated' && accessToken) {
        realtimeClient.connect();
      } else {
        realtimeClient.disconnect();
      }
    };

    const stopListeningForErrors = realtimeClient.onConnectError((error) => {
      if (error.message !== 'Unauthorized' || refreshing) return;

      refreshing = true;
      void authService
        .refresh()
        .then((session) => {
          if (!active) return;
          setAuthSession(session);
          realtimeClient.setAccessToken(session.accessToken);
          realtimeClient.reconnect();
        })
        .catch(() => {
          if (active) clearAuthStore();
        })
        .finally(() => {
          refreshing = false;
        });
    });
    const unsubscribe = authStore.subscribe(syncConnection);
    syncConnection();

    return () => {
      active = false;
      unsubscribe();
      stopListeningForErrors();
      realtimeClient.disconnect();
    };
  }, []);

  return children;
}
