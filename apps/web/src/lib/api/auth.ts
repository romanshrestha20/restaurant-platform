import { apiClient } from "./client";

export type AuthUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
};

export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & { firstName: string; lastName: string };
export type AuthSession = { user: AuthUser; accessToken: string };

export const authApi = {
  login: (input: LoginInput) => apiClient.post<AuthSession>("/auth/login", input).then(({ data }) => data),
  register: (input: RegisterInput) => apiClient.post<AuthSession>("/auth/register", input).then(({ data }) => data),
  me: () => apiClient.get<AuthUser>("/auth/me").then(({ data }) => data),
  logout: () => apiClient.post<void>("/auth/logout").then(({ data }) => data),
};
