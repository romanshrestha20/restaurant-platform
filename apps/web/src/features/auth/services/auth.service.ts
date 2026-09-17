import { api, refreshAccessToken } from '@/lib/api/client';
import type {
  AuthSessionResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
} from '../types';

export const authService = {
  login(input: LoginInput) {
    return api.post<AuthSessionResponse>('/auth/login', input);
  },
  register(input: RegisterInput) {
    return api.post<AuthSessionResponse>('/auth/register', input);
  },
  refresh() {
    return refreshAccessToken();
  },
  getCurrentUser() {
    return api.get<AuthUser>('/auth/me');
  },
  logout() {
    return api.post<void>('/auth/logout');
  },
};
