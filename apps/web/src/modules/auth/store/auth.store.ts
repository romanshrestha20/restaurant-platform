'use client';

import { createExternalStore } from '@/lib/store/create-external-store';
import type { AuthSession, AuthStatus, AuthUser } from '../types/auth.types';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
};

const initialState: AuthState = {
  status: 'loading',
  user: null,
  accessToken: null,
};

export const authStore = createExternalStore(initialState);
export const useAuthStore = authStore.useStore;

export function setAuthSession(session: AuthSession) {
  authStore.setState({
    status: 'authenticated',
    user: session.user,
    accessToken: session.accessToken,
  });
}

export function setAuthUser(user: AuthUser) {
  authStore.setState({ user });
}

export function setAuthStatus(status: AuthStatus) {
  authStore.setState({ status });
}

export function clearAuthStore() {
  authStore.setState({
    status: 'unauthenticated',
    user: null,
    accessToken: null,
  });
}
