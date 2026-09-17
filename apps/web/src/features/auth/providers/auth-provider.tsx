'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isApiError } from '@/lib/api/errors';
import { accessTokenStore } from '../services/access-token.store';
import { authService } from '../services/auth.service';
import type { AuthUser, LoginInput, RegisterInput } from '../types';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthUser | null>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const setAuthenticatedUser = useCallback(
    (nextUser: AuthUser | null) => {
      setUser(nextUser);
      if (nextUser) queryClient.setQueryData(['auth', 'me'], nextUser);
      else queryClient.removeQueries({ queryKey: ['auth', 'me'] });
    },
    [queryClient],
  );

  const refresh = useCallback(async () => {
    try {
      const session = await authService.refresh();
      accessTokenStore.set(session.accessToken);
      const currentUser = await authService.getCurrentUser();
      setAuthenticatedUser(currentUser);
      return currentUser;
    } catch (error) {
      accessTokenStore.clear();
      setAuthenticatedUser(null);
      if (!isApiError(error) || ![0, 401].includes(error.statusCode)) {
        console.warn('Auth session recovery failed.', error);
      }
      return null;
    }
  }, [setAuthenticatedUser]);

  useEffect(() => {
    void refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(async (input: LoginInput) => {
    const session = await authService.login(input);
    accessTokenStore.set(session.accessToken);
    setAuthenticatedUser(await authService.getCurrentUser());
  }, [setAuthenticatedUser]);

  const register = useCallback(async (input: RegisterInput) => {
    const session = await authService.register(input);
    accessTokenStore.set(session.accessToken);
    setAuthenticatedUser(await authService.getCurrentUser());
  }, [setAuthenticatedUser]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      accessTokenStore.clear();
      setAuthenticatedUser(null);
    }
  }, [setAuthenticatedUser]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      refresh,
    }),
    [user, isLoading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
