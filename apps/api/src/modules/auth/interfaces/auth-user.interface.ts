export interface AccessAuthUser {
  id: string;
  email: string;
  roles: string[];
}

export interface RefreshAuthUser {
  id: string;
  sessionId: string;
  refreshToken: string;
}
