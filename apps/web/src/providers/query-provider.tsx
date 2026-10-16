'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isApiError } from '@/lib/api/errors';
import { accessTokenStore } from '@/features/auth/services/access-token.store';
import { clearRefreshPromise } from '@/lib/api/client';
import { useEffect, useState, type ReactNode } from 'react';

/**
 * Called by the QueryClient when a query or mutation fails with an
 * unauthenticated error that the refresh interceptor could not recover from.
 *
 * We clear client-side auth state here so the UI moves to the signed-out
 * state without waiting for an AuthProvider action. The AuthProvider's own
 * React state will be reset the next time any component calls useAuth(), or
 * when the user refreshes the page and session recovery fails.
 *
 * Note: we cannot call AuthProvider.logout() here because QueryProvider is
 * outside AuthProvider in the tree. Instead we clear the token and the
 * single-flight promise directly — the same actions logout() performs before
 * hitting the network. The AuthProvider responds through its own state.
 */
function handleGlobal401(): void {
  clearRefreshPromise();
  accessTokenStore.clear();
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: (failureCount, error) => {
          // Never retry auth errors — the refresh interceptor already tried.
          if (isApiError(error) && [401, 403, 404].includes(error.statusCode)) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        onError: (error) => {
          if (isApiError(error) && error.statusCode === 401) {
            handleGlobal401();
          }
        },
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // Create the QueryClient once per component instance (never recreated).
  const [queryClient] = useState(makeQueryClient);

  // Attach a cache observer to catch 401 query failures globally. This covers
  // cases where the refresh interceptor itself fails and the error reaches
  // React Query.
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.action.type === 'error' &&
        isApiError(event.action.error) &&
        event.action.error.statusCode === 401
      ) {
        handleGlobal401();
      }
    });
    return unsubscribe;
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
