import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { AppEnvironment } from '../../../config/env';
import { isPlatformRole } from '@restaurant/database/authorization';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../interfaces/jwt-payload.interface';

type TokenUser = {
  id: string;
  email: string;
  roles: Array<{ role: { name: string } }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasValidJwtTimestamps = (payload: Record<string, unknown>): boolean =>
  (payload.iat === undefined || typeof payload.iat === 'number') &&
  (payload.exp === undefined || typeof payload.exp === 'number');

const isAccessTokenPayload = (value: unknown): value is AccessTokenPayload =>
  isRecord(value) &&
  value.tokenType === 'access' &&
  typeof value.sub === 'string' &&
  typeof value.email === 'string' &&
  Array.isArray(value.roles) &&
  value.roles.every((role) => typeof role === 'string') &&
  value.roles.every(isPlatformRole) &&
  hasValidJwtTimestamps(value);

const isRefreshTokenPayload = (value: unknown): value is RefreshTokenPayload =>
  isRecord(value) &&
  value.tokenType === 'refresh' &&
  typeof value.sub === 'string' &&
  typeof value.sid === 'string' &&
  typeof value.jti === 'string' &&
  hasValidJwtTimestamps(value);

@Injectable()
export class AuthTokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly jwtService: JwtService,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.accessSecret = config.get('JWT_ACCESS_SECRET', { infer: true });
    this.refreshSecret = config.get('JWT_REFRESH_SECRET', { infer: true });
    this.accessTtlSeconds = config.get('JWT_ACCESS_TTL_SECONDS', {
      infer: true,
    });
    this.refreshTtlSeconds = config.get('JWT_REFRESH_TTL_SECONDS', {
      infer: true,
    });
  }

  signAccessToken(user: TokenUser): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        roles: user.roles.map(({ role }) => role.name).filter(isPlatformRole),
        tokenType: 'access',
      },
      {
        secret: this.accessSecret,
        expiresIn: this.accessTtlSeconds,
      },
    );
  }

  signRefreshToken(userId: string, sessionId: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        sid: sessionId,
        jti: randomUUID(),
        tokenType: 'refresh',
      },
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshTtlSeconds,
      },
    );
  }

  createSessionId(): string {
    return randomUUID();
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload: unknown = await this.jwtService.verifyAsync(token, {
        secret: this.accessSecret,
      });

      if (!isAccessTokenPayload(payload)) {
        throw new UnauthorizedException('Invalid access token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload: unknown = await this.jwtService.verifyAsync(token, {
        secret: this.refreshSecret,
      });

      if (!isRefreshTokenPayload(payload)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  refreshTokenMatches(token: string, storedHash: string): boolean {
    const presentedHash = Buffer.from(this.hashRefreshToken(token), 'hex');
    const expectedHash = Buffer.from(storedHash, 'hex');

    return (
      presentedHash.length === expectedHash.length &&
      timingSafeEqual(presentedHash, expectedHash)
    );
  }

  getRefreshExpiration(): Date {
    return new Date(Date.now() + this.refreshTtlSeconds * 1_000);
  }
}
