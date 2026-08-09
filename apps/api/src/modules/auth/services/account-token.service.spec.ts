import { ConfigService } from '@nestjs/config';
import type { AppEnvironment } from '../../../config/env';
import { ACCOUNT_TOKEN_TYPES } from '../types/account-token.type';
import { AccountTokenService } from './account-token.service';

const config = {
  get: jest.fn((key: keyof AppEnvironment) => {
    if (key === 'EMAIL_VERIFICATION_TTL_SECONDS') return 86_400;
    if (key === 'PASSWORD_RESET_TTL_SECONDS') return 3_600;
    return undefined;
  }),
} as unknown as ConfigService<AppEnvironment, true>;

describe('AccountTokenService', () => {
  const service = new AccountTokenService(config);

  it('creates a random token and exposes only its deterministic hash for storage', () => {
    const first = service.createToken(ACCOUNT_TOKEN_TYPES.PASSWORD_RESET);
    const second = service.createToken(ACCOUNT_TOKEN_TYPES.PASSWORD_RESET);

    expect(first.rawToken).toMatch(/^[a-f0-9]{64}$/);
    expect(first.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.tokenHash).toBe(service.hashToken(first.rawToken));
    expect(first.rawToken).not.toBe(first.tokenHash);
    expect(second.rawToken).not.toBe(first.rawToken);
  });

  it('uses separate expiration settings for each token purpose', () => {
    const now = Date.now();
    const verification = service.createToken(
      ACCOUNT_TOKEN_TYPES.EMAIL_VERIFICATION,
    );
    const reset = service.createToken(ACCOUNT_TOKEN_TYPES.PASSWORD_RESET);

    expect(verification.expiresAt.getTime()).toBeGreaterThanOrEqual(
      now + 86_400_000,
    );
    expect(reset.expiresAt.getTime()).toBeGreaterThanOrEqual(now + 3_600_000);
  });
});
