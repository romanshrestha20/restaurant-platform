'use client';

import { useCallback } from 'react';
import { useToast } from '@/lib/toast';
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
  const toast = useToast();

  const login = useCallback(async (email: string, password: string) => {
    setAuthStatus('loading');
    try {
      const session = await authService.login({ email, password });
      setAuthSession(session);
      toast.success('Signed in');
    } catch (error) {
      clearAuthStore();
      throw error;
    }
  }, [toast]);

  const register = useCallback(async (input: RegisterInput) => {
    setAuthStatus('loading');
    try {
      const session = await authService.register(input);
      setAuthSession(session);
      toast.success('Account created');
    } catch (error) {
      clearAuthStore();
      throw error;
    }
  }, [toast]);

  const logout = useCallback(async (options: { notify?: boolean } = {}) => {
    try {
      await authService.logout();
    } finally {
      clearAuthStore();
      resetUserStore();
      if (options.notify !== false) toast.info('Signed out');
    }
  }, [toast]);

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
