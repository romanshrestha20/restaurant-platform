import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import { normalizeError } from './errors';
import { accessTokenStore } from '@/features/auth/services/access-token.store';
import type { AuthSessionResponse } from '@/features/auth/types';

type RetryableRequestConfig = AxiosRequestConfig & {
  _authRetry?: boolean;
  _skipAuthRefresh?: boolean;
};

export type RefreshedSession = AuthSessionResponse;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

// ---------------------------------------------------------------------------
// Request interceptor — attach Bearer token
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use((config) => {
  const token = accessTokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Single-flight refresh state
// ---------------------------------------------------------------------------

/**
 * In-flight refresh promise. All concurrent 401s share this promise so only
 * one POST /auth/refresh is ever made at a time.
 */
let refreshPromise: Promise<RefreshedSession> | null = null;
let refreshGeneration = 0;

/**
 * Clear the single-flight promise. Call this on logout so a stale in-flight
 * refresh cannot re-authenticate the user.
 */
export function clearRefreshPromise(): void {
  refreshGeneration += 1;
  refreshPromise = null;
}

// ---------------------------------------------------------------------------
// Response interceptor — handle 401 with token refresh + retry
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined;

    // Only intercept 401s that have not already been retried and are not the
    // refresh call itself (which is marked _skipAuthRefresh).
    if (
      error.response?.status !== 401 ||
      !config ||
      config._authRetry ||
      config._skipAuthRefresh
    ) {
      return Promise.reject(normalizeError(error));
    }

    try {
      // Coalesce concurrent 401s into a single refresh call.
      const requestRefreshGeneration = refreshGeneration;
      refreshPromise ??= refreshAccessToken();
      const session = await refreshPromise;

      // A logout or another explicit session clear happened while refresh was
      // in flight. Do not let that old response revive the cleared session.
      if (requestRefreshGeneration !== refreshGeneration) {
        return Promise.reject(normalizeError(error));
      }

      accessTokenStore.set(session.accessToken);

      // Retry the original request with the new token.
      config._authRetry = true;
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${session.accessToken}`;
      return apiClient.request(config);
    } catch (refreshError) {
      // Refresh failed — clear stored token so future requests are unauthed.
      accessTokenStore.clear();
      return Promise.reject(normalizeError(refreshError));
    }
  },
);

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

/**
 * POST /auth/refresh using the httpOnly refresh cookie.
 * Marked _skipAuthRefresh so it never recurses through the 401 interceptor.
 * Always resets the single-flight promise when done (success or failure).
 */
export async function refreshAccessToken(): Promise<RefreshedSession> {
  const promiseGeneration = refreshGeneration;
  try {
    const response = await apiClient.post<RefreshedSession>(
      '/auth/refresh',
      undefined,
      { _skipAuthRefresh: true } as RetryableRequestConfig,
    );
    return response.data;
  } finally {
    // An older refresh must not erase a newer single-flight promise.
    if (promiseGeneration === refreshGeneration) {
      refreshPromise = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Typed convenience wrappers
// ---------------------------------------------------------------------------

export const api = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },
};
