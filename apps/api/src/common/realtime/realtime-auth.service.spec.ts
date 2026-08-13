import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthTokenService } from '../../modules/auth/services/auth-token.service';
import { RealtimeAuthService } from './realtime-auth.service';
import type { RealtimeSocket } from './realtime.types';

describe('RealtimeAuthService', () => {
  let service: RealtimeAuthService;
  let verifyAccessToken: jest.Mock;

  beforeEach(async () => {
    verifyAccessToken = jest.fn().mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
      roles: [],
      tokenType: 'access',
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeAuthService,
        {
          provide: AuthTokenService,
          useValue: { verifyAccessToken },
        },
      ],
    }).compile();

    service = module.get(RealtimeAuthService);
  });

  it('authenticates with the Socket.IO auth payload', async () => {
    const socket = {
      handshake: { auth: { token: 'access-token' }, headers: {} },
      data: {},
    } as unknown as RealtimeSocket;

    await service.authenticate(socket);

    expect(verifyAccessToken).toHaveBeenCalledWith('access-token');
    expect(socket.data.user).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      roles: [],
    });
  });

  it('supports a bearer authorization header', async () => {
    const socket = {
      handshake: {
        auth: {},
        headers: { authorization: 'Bearer header-token' },
      },
      data: {},
    } as unknown as RealtimeSocket;

    await service.authenticate(socket);

    expect(verifyAccessToken).toHaveBeenCalledWith('header-token');
  });

  it('rejects a handshake without a token', async () => {
    const socket = {
      handshake: { auth: {}, headers: {} },
      data: {},
    } as unknown as RealtimeSocket;

    await expect(service.authenticate(socket)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
