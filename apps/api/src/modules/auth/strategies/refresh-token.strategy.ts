import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppEnvironment } from '../../../config/env';
import { REFRESH_TOKEN_COOKIE } from '../constants/auth.constants';
import { RefreshTokenPayload } from '../interfaces/jwt-payload.interface';

const extractRefreshToken = (request: Request): string | null => {
  const cookies = request.cookies as unknown;
  if (typeof cookies !== 'object' || cookies === null) {
    return null;
  }

  const token = (cookies as Record<string, unknown>)[REFRESH_TOKEN_COOKIE];
  return typeof token === 'string' ? token : null;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService<AppEnvironment, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractRefreshToken]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_REFRESH_SECRET', { infer: true }),
      passReqToCallback: true,
    });
  }

  validate(request: Request, payload: RefreshTokenPayload) {
    const refreshToken = extractRefreshToken(request);

    if (
      !refreshToken ||
      payload.tokenType !== 'refresh' ||
      !payload.sid ||
      !payload.jti
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      id: payload.sub,
      sessionId: payload.sid,
      refreshToken,
    };
  }
}
