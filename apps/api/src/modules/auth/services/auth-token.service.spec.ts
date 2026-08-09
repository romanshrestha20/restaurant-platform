import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppEnvironment } from '../../../config/env';
import { AuthTokenService } from './auth-token.service';

const configValues: AppEnvironment = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  CLIENT_URL: 'http://localhost:3000',
  JWT_ACCESS_SECRET: 'a'.repeat(64),
  JWT_REFRESH_SECRET: 'b'.repeat(64),
  JWT_ACCESS_TTL_SECONDS: 900,
  JWT_REFRESH_TTL_SECONDS: 2_592_000,
  EMAIL_VERIFICATION_TTL_SECONDS: 86_400,
  PASSWORD_RESET_TTL_SECONDS: 3_600,
  MAIL_MODE: 'log',
  MAIL_FROM: 'no-reply@example.com',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  UPLOAD_STORAGE_PROVIDER: 'local',
  UPLOAD_LOCAL_DIR: 'uploads',
  UPLOAD_PUBLIC_URL: 'http://localhost:3001/uploads',
  HEALTH_DATABASE_TIMEOUT_MS: 3_000,
};

const config = {
  get: jest.fn((key: keyof AppEnvironment) => configValues[key]),
} as unknown as ConfigService<AppEnvironment, true>;

describe('AuthTokenService', () => {
  const service = new AuthTokenService(new JwtService(), config);
  const user = {
    id: 'user-1',
    email: 'customer@example.com',
    roles: [{ role: { name: 'CUSTOMER' } }],
  };

  it('signs and verifies access tokens with the expected payload', async () => {
    const token = await service.signAccessToken(user);
    const payload = await service.verifyAccessToken(token);

    expect(payload).toMatchObject({
      sub: user.id,
      email: user.email,
      roles: ['CUSTOMER'],
      tokenType: 'access',
    });
  });

  it('signs unique refresh tokens and verifies sid and jti', async () => {
    const first = await service.signRefreshToken(user.id, 'session-1');
    const second = await service.signRefreshToken(user.id, 'session-1');
    const payload = await service.verifyRefreshToken(first);

    expect(first).not.toBe(second);
    expect(payload).toMatchObject({
      sub: user.id,
      sid: 'session-1',
      tokenType: 'refresh',
      jti: expect.any(String),
    });
  });

  it('does not accept a refresh token as an access token', async () => {
    const refreshToken = await service.signRefreshToken(user.id, 'session-1');

    await expect(
      service.verifyAccessToken(refreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('hashes refresh tokens and compares hashes safely', () => {
    const storedHash = service.hashRefreshToken('refresh-token');

    expect(service.refreshTokenMatches('refresh-token', storedHash)).toBe(true);
    expect(service.refreshTokenMatches('different-token', storedHash)).toBe(
      false,
    );
  });
});
