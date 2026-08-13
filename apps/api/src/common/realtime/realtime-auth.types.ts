import type { PlatformRoleName } from '@restaurant/database/authorization';

export interface RealtimeUser {
  id: string;
  email: string;
  roles: PlatformRoleName[];
}

export interface RealtimeSocketAuth {
  token?: string;
}
