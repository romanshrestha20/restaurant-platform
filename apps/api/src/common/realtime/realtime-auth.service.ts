import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthTokenService } from '../../modules/auth/services/auth-token.service';
import type { RealtimeSocket } from './realtime.types';

@Injectable()
export class RealtimeAuthService {
  constructor(private readonly authTokenService: AuthTokenService) {}

  async authenticate(client: RealtimeSocket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    const payload = await this.authTokenService.verifyAccessToken(token);
    client.data.user = {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }

  private extractToken(client: RealtimeSocket): string | null {
    const authToken = client.handshake.auth.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization !== 'string') return null;

    const [scheme, token] = authorization.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token ? token : null;
  }
}
