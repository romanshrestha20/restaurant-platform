import { apiClient } from '@/lib/api';
import type {
  AuthSession,
  LoginInput,
  RegisterInput,
} from '../types/auth.types';

let refreshRequest: Promise<AuthSession> | null = null;

export const authService = {
  forgotPassword(email: string) {
    return apiClient.post<{ message: string }>('/auth/password/forgot', { email }, {
      skipAuthRefresh: true,
    });
  },

  resetPassword(token: string, password: string) {
    return apiClient.post<{ message: string }>('/auth/password/reset', { token, password }, {
      skipAuthRefresh: true,
    });
  },

  login(input: LoginInput) {
    return apiClient.post<AuthSession>('/auth/login', input, {
      skipAuthRefresh: true,
    });
  },

  register(input: RegisterInput) {
    return apiClient.post<AuthSession>('/auth/register', input, {
      skipAuthRefresh: true,
    });
  },

  refresh() {
    if (!refreshRequest) {
      refreshRequest = apiClient
        .post<AuthSession>('/auth/refresh', undefined, {
          skipAuthRefresh: true,
        })
        .finally(() => {
          refreshRequest = null;
        });
    }
    return refreshRequest;
  },

  logout() {
    return apiClient.post<void>('/auth/logout', undefined, {
      skipAuthRefresh: true,
    });
  },
};
