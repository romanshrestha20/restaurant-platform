import type { PlatformRoleName } from '@restaurant/database/authorization';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: PlatformRoleName[];
  tokenType: 'access';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  jti: string;
  tokenType: 'refresh';
  iat?: number;
  exp?: number;
}
