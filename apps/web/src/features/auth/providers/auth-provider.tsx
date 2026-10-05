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
import { clearRefreshPromise } from '@/lib/api/client';
import { accessTokenStore } from '../services/access-token.store';
import { authService } from '../services/auth.service';
import type { AuthUser, LoginInput, RegisterInput } from '../types';
import { normalizeSessionUser } from '../types';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export type AuthContextValue = {
  /** The authenticated user, or null when unauthenticated. */
  user: AuthUser | null;
  /** True once the initial session check has completed. */
  isAuthenticated: boolean;
  /**
   * True while the initial session recovery (refresh on mount) is in
   * progress. Gates rendering of protected UI.
   */
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Manually re-run session recovery. Useful after a hard navigation or
   * when the 401 handler has cleared local state.
   */
  refresh: () => Promise<AuthUser | null>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Session recovery
// ---------------------------------------------------------------------------

/**
 * Attempt to restore the session from the httpOnly refresh cookie.
 *
 * The refresh endpoint already returns { user, accessToken } — we do NOT
 * make a second GET /auth/me round-trip. Resolves to null when there is no
 * recoverable session; never rejects.
 */
async function recoverSession(): Promise<AuthUser | null> {
  try {
    const session = await authService.refresh();
    accessTokenStore.set(session.accessToken);
    // session.user is AuthSessionUser with nested roles — normalise it.
    return normalizeSessionUser(session.user);
  } catch (error) {
    accessTokenStore.clear();
    // 401 and network errors are expected for unauthenticated visitors.
    if (!isApiError(error) || ![0, 401].includes(error.statusCode)) {
      console.warn('[AuthProvider] Session recovery failed.', error);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /**
   * Sync user into both local state and the React Query cache so that
   * components that use useQuery(['auth', 'me']) stay consistent.
   */
  const setAuthenticatedUser = useCallback(
    (nextUser: AuthUser | null) => {
      setUser(nextUser);
      if (nextUser) {
        queryClient.setQueryData<AuthUser>(['auth', 'me'], nextUser);
      } else {
        // Remove all auth queries and protected customer queries so they
        // refetch cleanly on the next authenticated session.
        queryClient.removeQueries({ queryKey: ['auth'] });
        queryClient.removeQueries({ queryKey: ['cart'] });
      }
    },
    [queryClient],
  );

  // An Axios interceptor or React Query can clear an unrecoverable session
  // outside this provider. Keep the visible account state in sync.
  useEffect(
    () => accessTokenStore.onClear(() => setAuthenticatedUser(null)),
    [setAuthenticatedUser],
  );

  // -------------------------------------------------------------------------
  // Session recovery (runs once on mount)
  // -------------------------------------------------------------------------

  /** Re-run session recovery and sync the result into context. */
  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    const authUser = await recoverSession();
    setAuthenticatedUser(authUser);
    return authUser;
  }, [setAuthenticatedUser]);

  useEffect(() => {
    let isActive = true;
    void recoverSession().then((authUser) => {
      if (!isActive) return;
      setAuthenticatedUser(authUser);
      setIsLoading(false);
    });
    return () => {
      isActive = false;
    };
  }, [setAuthenticatedUser]);

  // -------------------------------------------------------------------------
  // Auth actions
  // -------------------------------------------------------------------------

  /**
   * POST /auth/login → set access token → normalise user from response body.
   * No extra GET /auth/me needed — the login body already contains the user.
   */
  const login = useCallback(
    async (input: LoginInput): Promise<void> => {
      const session = await authService.login(input);
      accessTokenStore.set(session.accessToken);
      setAuthenticatedUser(normalizeSessionUser(session.user));
    },
    [setAuthenticatedUser],
  );

  /**
   * POST /auth/register → set access token → normalise user from response body.
   */
  const register = useCallback(
    async (input: RegisterInput): Promise<void> => {
      const session = await authService.register(input);
      accessTokenStore.set(session.accessToken);
      setAuthenticatedUser(normalizeSessionUser(session.user));
    },
    [setAuthenticatedUser],
  );

  /**
   * POST /auth/logout — clears the httpOnly refresh cookie on the server.
   *
   * We also:
   *  1. Clear the in-memory access token.
   *  2. Clear the single-flight refresh promise so a concurrent refresh
   *     cannot restore the session after logout.
   *  3. Invalidate all auth and protected query caches.
   */
  const logout = useCallback(async (): Promise<void> => {
    // Optimistically clear client state before the network call so the UI
    // resets immediately even if the server request is slow or fails.
    clearRefreshPromise();
    accessTokenStore.clear();
    setAuthenticatedUser(null);

    try {
      await authService.logout();
    } catch (error) {
      // Server logout failure is non-fatal — local session is already cleared.
      if (!isApiError(error) || error.statusCode !== 401) {
        console.warn('[AuthProvider] Logout request failed.', error);
      }
    }
  }, [setAuthenticatedUser]);

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------

  const value = useMemo<AuthContextValue>(
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
