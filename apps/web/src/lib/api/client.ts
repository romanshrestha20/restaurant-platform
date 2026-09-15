import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';
import { normalizeError } from './errors';
import { accessTokenStore } from '@/features/auth/services/access-token.store';

type RetryableRequestConfig = AxiosRequestConfig & {
  _authRetry?: boolean;
  _skipAuthRefresh?: boolean;
};

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

apiClient.interceptors.request.use((config) => {
  const token = accessTokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined;
    if (error.response?.status !== 401 || !config || config._authRetry || config._skipAuthRefresh) {
      return Promise.reject(normalizeError(error));
    }

    try {
      refreshPromise ??= refreshAccessToken();
      const session = await refreshPromise;
      accessTokenStore.set(session.accessToken);
      config._authRetry = true;
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${session.accessToken}`;
      return apiClient.request(config);
    } catch (refreshError) {
      accessTokenStore.clear();
      return Promise.reject(normalizeError(refreshError));
    }
  },
);

let refreshPromise: Promise<{ accessToken: string }> | null = null;

async function refreshAccessToken(): Promise<{ accessToken: string }> {
  try {
    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', undefined, {
      _skipAuthRefresh: true,
    } as RetryableRequestConfig);
    return response.data;
  } finally {
    refreshPromise = null;
  }
}

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
