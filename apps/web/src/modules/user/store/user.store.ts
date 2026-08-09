'use client';

import { createExternalStore } from '@/lib/store/create-external-store';
import type { UserProfile, UserStatus } from '../types/user.types';

type UserState = {
  profile: UserProfile | null;
  status: UserStatus;
  error: string | null;
};

const initialState: UserState = {
  profile: null,
  status: 'idle',
  error: null,
};

export const userStore = createExternalStore(initialState);
export const useUserStore = userStore.useStore;

export function setUserProfile(profile: UserProfile) {
  userStore.setState({ profile, status: 'ready', error: null });
}

export function setUserLoading() {
  userStore.setState({ status: 'loading', error: null });
}

export function setUserError(error: string) {
  userStore.setState({ status: 'error', error });
}

export function resetUserStore() {
  userStore.reset();
}
