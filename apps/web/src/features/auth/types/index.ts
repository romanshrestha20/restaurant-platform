export type AuthUser = {
  id: string;
  email: string;
  roles: string[];
};

export type AuthSessionResponse = {
  user: AuthUser;
  accessToken: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
};
