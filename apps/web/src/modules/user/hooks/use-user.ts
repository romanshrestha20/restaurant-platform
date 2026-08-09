'use client';

import { useCallback } from 'react';
import { ApiError } from '@/lib/api';
import { authStore, setAuthUser } from '@/modules/auth/store/auth.store';
import { userService } from '../services/user.service';
import {
  setUserError,
  setUserLoading,
  setUserProfile,
  useUserStore,
} from '../store/user.store';
import type {
  ChangePasswordInput,
  UpdateUserProfileInput,
  UserProfile,
} from '../types/user.types';

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

function syncAuthUser(profile: UserProfile) {
  const authUser = authStore.getState().user;
  if (!authUser) return;

  setAuthUser({
    ...authUser,
    email: profile.email,
    phone: profile.phone,
    emailVerified: profile.emailVerified,
    phoneVerified: profile.phoneVerified,
    isActive: profile.isActive,
    profile: profile.profile
      ? {
          firstName: profile.profile.firstName,
          lastName: profile.profile.lastName,
        }
      : null,
  });
}

export function useUser() {
  const state = useUserStore();

  const fetchCurrentUser = useCallback(async () => {
    setUserLoading();
    try {
      const profile = await userService.getCurrentUser();
      setUserProfile(profile);
      syncAuthUser(profile);
      return profile;
    } catch (error) {
      setUserError(errorMessage(error, 'Could not load your profile.'));
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (input: UpdateUserProfileInput) => {
    const profile = await userService.updateProfile(input);
    setUserProfile(profile);
    syncAuthUser(profile);
    return profile;
  }, []);

  const uploadPhoto = useCallback(async (file: File) => {
    const profile = await userService.uploadPhoto(file);
    setUserProfile(profile);
    return profile;
  }, []);

  const changePassword = useCallback((input: ChangePasswordInput) => {
    return userService.changePassword(input);
  }, []);

  return {
    ...state,
    changePassword,
    fetchCurrentUser,
    updateProfile,
    uploadPhoto,
  };
}
