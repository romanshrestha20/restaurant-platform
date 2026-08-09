export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: string[];
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
