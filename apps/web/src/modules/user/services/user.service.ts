import { apiClient } from '@/lib/api';
import type {
  ChangePasswordInput,
  UpdateUserProfileInput,
  UserProfile,
} from '../types/user.types';

let currentUserRequest: Promise<UserProfile> | null = null;

export const userService = {
  getCurrentUser() {
    if (!currentUserRequest) {
      currentUserRequest = apiClient.get<UserProfile>('/profile').finally(() => {
        currentUserRequest = null;
      });
    }
    return currentUserRequest;
  },

  updateProfile(input: UpdateUserProfileInput) {
    return apiClient.patch<UserProfile>('/profile', input);
  },

  uploadPhoto(file: File) {
    const body = new FormData();
    body.append('photo', file);
    return apiClient.post<UserProfile>('/profile/photo', body);
  },

  changePassword(input: ChangePasswordInput) {
    return apiClient.patch<{ message: string }>('/profile/password', input);
  },
};
