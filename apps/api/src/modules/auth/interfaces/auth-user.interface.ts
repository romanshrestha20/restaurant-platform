import type { PlatformRoleName } from '@restaurant/database/authorization';

export interface AccessAuthUser {
  id: string;
  email: string;
  roles: PlatformRoleName[];
}

export interface RefreshAuthUser {
  id: string;
  sessionId: string;
  refreshToken: string;
}
