import { Test, TestingModule } from '@nestjs/testing';
import type { Namespace } from 'socket.io';
import { REALTIME_EVENTS, realtimeUserRoom } from './realtime.constant';
import { RealtimeAuthService } from './realtime-auth.service';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeRoomService } from './realtime-room.service';
import type { RealtimeSocket } from './realtime.types';

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let authenticate: jest.Mock;
  let findRestaurantIdsForUser: jest.Mock;

  beforeEach(async () => {
    authenticate = jest.fn().mockResolvedValue(undefined);
    findRestaurantIdsForUser = jest.fn().mockResolvedValue(['restaurant-1']);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        {
          provide: RealtimeAuthService,
          useValue: { authenticate },
        },
        {
          provide: RealtimeRoomService,
          useValue: { findRestaurantIdsForUser },
        },
      ],
    }).compile();

    gateway = module.get<RealtimeGateway>(RealtimeGateway);
  });

  it('registers authentication middleware on initialization', async () => {
    let middleware:
      | ((socket: RealtimeSocket, next: (error?: Error) => void) => void)
      | undefined;
    const server = {
      use: jest.fn((handler) => {
        middleware = handler;
      }),
    } as unknown as Namespace;
    const socket = { data: {} } as RealtimeSocket;
    const next = jest.fn();

    gateway.afterInit(server);
    middleware?.(socket, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(authenticate).toHaveBeenCalledWith(socket);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a socket when authentication fails', async () => {
    authenticate.mockRejectedValueOnce(new Error('invalid token'));
    let middleware:
      | ((socket: RealtimeSocket, next: (error?: Error) => void) => void)
      | undefined;
    const server = {
      use: jest.fn((handler) => {
        middleware = handler;
      }),
    } as unknown as Namespace;
    const next = jest.fn();

    gateway.afterInit(server);
    middleware?.({ data: {} } as RealtimeSocket, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(new Error('Unauthorized'));
  });

  it('joins the user room and emits ready after connection', async () => {
    const socket = {
      id: 'socket-1',
      data: { user: { id: 'user-1', email: 'user@example.com', roles: [] } },
      join: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
    } as unknown as RealtimeSocket;

    await gateway.handleConnection(socket);

    expect(socket.data.connectedAt).toBeInstanceOf(Date);
    expect(socket.join).toHaveBeenCalledWith([
      realtimeUserRoom('user-1'),
      'restaurant:restaurant-1',
    ]);
    expect(socket.emit).toHaveBeenCalledWith(
      REALTIME_EVENTS.READY,
      expect.objectContaining({ userId: 'user-1' }),
    );
  });

  it('disconnects a client missing authenticated user data', async () => {
    const socket = {
      data: {},
      disconnect: jest.fn(),
    } as unknown as RealtimeSocket;

    await gateway.handleConnection(socket);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  it('responds to a ping with server timing data', () => {
    const response = gateway.handlePing({
      sentAt: '2026-08-13T10:00:00.000Z',
    });

    expect(response).toEqual({
      event: REALTIME_EVENTS.PONG,
      data: {
        sentAt: '2026-08-13T10:00:00.000Z',
        receivedAt: expect.any(String),
      },
    });
  });

  it('handles disconnect after a connected session', () => {
    const socket = {
      id: 'socket-1',
      data: {
        user: { id: 'user-1', email: 'user@example.com', roles: [] },
        connectedAt: new Date(),
      },
    } as unknown as RealtimeSocket;

    expect(() => gateway.handleDisconnect(socket)).not.toThrow();
  });
});
