'use client';

import { useCallback } from 'react';
import { resetUserStore } from '@/modules/user/store/user.store';
import { authService } from '../services/auth.service';
import {
  clearAuthStore,
  setAuthSession,
  setAuthStatus,
  useAuthStore,
} from '../store/auth.store';
import type { RegisterInput } from '../types/auth.types';

export function useAuth() {
  const state = useAuthStore();

  const login = useCallback(async (email: string, password: string) => {
    setAuthStatus('loading');
    try {
      const session = await authService.login({ email, password });
      setAuthSession(session);
    } catch (error) {
      clearAuthStore();
      throw error;
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setAuthStatus('loading');
    try {
      const session = await authService.register(input);
      setAuthSession(session);
    } catch (error) {
      clearAuthStore();
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAuthStore();
      resetUserStore();
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    register,
    signIn: login,
    signOut: logout,
    signUp: register,
  };
}
