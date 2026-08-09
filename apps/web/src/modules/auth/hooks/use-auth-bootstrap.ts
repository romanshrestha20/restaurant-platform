'use client';

import { useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { resetUserStore } from '@/modules/user/store/user.store';
import { authService } from '../services/auth.service';
import {
  authStore,
  clearAuthStore,
  setAuthSession,
} from '../store/auth.store';

export function useAuthBootstrap() {
  useEffect(() => {
    let active = true;

    const clearSession = () => {
      clearAuthStore();
      resetUserStore();
    };

    apiClient.configureAuth({
      getAccessToken: () => authStore.getState().accessToken,
      refreshSession: async () => {
        const session = await authService.refresh();
        if (active) setAuthSession(session);
      },
      onUnauthorized: clearSession,
    });

    authService
      .refresh()
      .then((session) => {
        if (active) setAuthSession(session);
      })
      .catch(() => {
        if (active) clearSession();
      });

    return () => {
      active = false;
    };
  }, []);
}
