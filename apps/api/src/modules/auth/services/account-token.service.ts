import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import type { AppEnvironment } from '../../../config/env';
import {
  ACCOUNT_TOKEN_TYPES,
  type AccountTokenType,
} from '../types/account-token.type';

@Injectable()
export class AccountTokenService {
  constructor(private readonly config: ConfigService<AppEnvironment, true>) {}

  createToken(type: AccountTokenType): {
    rawToken: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const rawToken = randomBytes(32).toString('hex');

    return {
      rawToken,
      tokenHash: this.hashToken(rawToken),
      expiresAt: new Date(Date.now() + this.getTtlSeconds(type) * 1_000),
    };
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private getTtlSeconds(type: AccountTokenType): number {
    return type === ACCOUNT_TOKEN_TYPES.EMAIL_VERIFICATION
      ? this.config.get('EMAIL_VERIFICATION_TTL_SECONDS', { infer: true })
      : this.config.get('PASSWORD_RESET_TTL_SECONDS', { infer: true });
  }
}
