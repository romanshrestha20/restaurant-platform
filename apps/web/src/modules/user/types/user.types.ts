export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type UserProfile = {
  id: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  photo: {
    url: string;
    publicId: string;
    fileName: string | null;
    mimeType: string | null;
    width: number | null;
    height: number | null;
    size: number | null;
    alt: string | null;
    createdAt: string;
  } | null;
  profile: {
    firstName: string;
    lastName: string;
    bio: string | null;
    gender: Gender | null;
    dateOfBirth: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateUserProfileInput = Partial<{
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
}>;

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type UserStatus = 'idle' | 'loading' | 'ready' | 'error';
