export type AuthUserResponse = {
  id: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  profile: {
    firstName: string;
    lastName: string;
  } | null;
  roles: Array<{
    role: {
      name: string;
    };
  }>;
};

export type AuthResponse = {
  user: AuthUserResponse;
  accessToken: string;
};

export type AuthSessionResponse = AuthResponse & {
  refreshToken: string;
};
