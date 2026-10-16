import { api, refreshAccessToken } from '@/lib/api/client';
import type {
  AuthSessionResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
} from '../types';

export const authService = {
  /**
   * POST /auth/login
   * Returns { user: AuthSessionUser, accessToken }.
   * The refresh token is set as an httpOnly cookie by the server.
   */
  login(input: LoginInput): Promise<AuthSessionResponse> {
    return api.post<AuthSessionResponse>('/auth/login', input);
  },

  /**
   * POST /auth/register
   * Returns { user: AuthSessionUser, accessToken }.
   */
  register(input: RegisterInput): Promise<AuthSessionResponse> {
    return api.post<AuthSessionResponse>('/auth/register', input);
  },

  /**
   * POST /auth/refresh
   * Uses the httpOnly refresh cookie — no body needed.
   * Returns { user: AuthSessionUser, accessToken }.
   */
  refresh(): ReturnType<typeof refreshAccessToken> {
    return refreshAccessToken();
  },

  /**
   * GET /auth/me
   * Returns the authenticated user from the Bearer token.
   * Used for cases where we only have a token and no session body.
   */
  getCurrentUser(): Promise<AuthUser> {
    return api.get<AuthUser>('/auth/me');
  },

  /**
   * POST /auth/logout
   * Requires a valid refresh token cookie — server clears the session.
   */
  logout(): Promise<void> {
    return api.post<void>('/auth/logout');
  },
};
