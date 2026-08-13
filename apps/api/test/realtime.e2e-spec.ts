import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { Server as HttpServer } from 'node:http';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { RealtimeGateway, RealtimeIoAdapter } from '../src/common/realtime';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../src/common/realtime/realtime.types';
import { AppModule } from '../src/app.module';
import { AuthRepository } from '../src/modules/auth/repositories/auth.repository';
import { AuthTokenService } from '../src/modules/auth/services/auth-token.service';
import { PasswordService } from '../src/modules/auth/services/password.service';
import { PrismaService } from '../src/prisma/prisma.service';

type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type StoredSession = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
};

const user = {
  id: 'user-1',
  email: 'owner@example.com',
  phone: null,
  passwordHash: 'password-hash',
  emailVerified: true,
  phoneVerified: false,
  isActive: true,
  deletedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  profile: { firstName: 'Aino', lastName: 'Owner' },
  roles: [{ role: { name: 'CUSTOMER' as const } }],
};

describe('Authenticated realtime connection (e2e)', () => {
  let app: INestApplication<App>;
  let baseUrl: string;
  let gateway: RealtimeGateway;
  let tokenService: AuthTokenService;
  const clients = new Set<TestSocket>();
  const sessions = new Map<string, StoredSession>();

  const restaurantMemberships = jest.fn((userId: string) =>
    userId === 'user-1'
      ? Promise.resolve([{ restaurantId: 'restaurant-1' }])
      : Promise.resolve([]),
  );

  const authRepository = {
    findUserForLogin: jest.fn().mockResolvedValue(user),
    recordLoginAttempt: jest.fn().mockResolvedValue(undefined),
    createSession: jest.fn((session: StoredSession) => {
      sessions.set(session.id, { ...session });
      return Promise.resolve(session);
    }),
    findSessionWithUser: jest.fn((sessionId: string) => {
      const session = sessions.get(sessionId);
      return Promise.resolve(session ? { ...session, user } : null);
    }),
    rotateSession: jest.fn(
      (rotation: {
        id: string;
        currentRefreshTokenHash: string;
        nextRefreshTokenHash: string;
        expiresAt: Date;
      }) => {
        const session = sessions.get(rotation.id);
        if (
          !session ||
          session.refreshTokenHash !== rotation.currentRefreshTokenHash
        ) {
          return Promise.resolve({ count: 0 });
        }

        sessions.set(rotation.id, {
          ...session,
          refreshTokenHash: rotation.nextRefreshTokenHash,
          expiresAt: rotation.expiresAt,
        });
        return Promise.resolve({ count: 1 });
      },
    ),
    deleteSession: jest.fn((sessionId: string, userId: string) => {
      const session = sessions.get(sessionId);
      const deleted = session?.userId === userId && sessions.delete(sessionId);
      return Promise.resolve({ count: deleted ? 1 : 0 });
    }),
    deleteAllSessions: jest.fn((userId: string) => {
      let count = 0;
      for (const [sessionId, session] of sessions) {
        if (session.userId === userId) {
          sessions.delete(sessionId);
          count += 1;
        }
      }
      return Promise.resolve({ count });
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        restaurantMember: {
          findMany: jest.fn(({ where }: { where: { userId: string } }) =>
            restaurantMemberships(where.userId),
          ),
        },
      })
      .overrideProvider(AuthRepository)
      .useValue(authRepository)
      .overrideProvider(PasswordService)
      .useValue({
        verifyPassword: jest.fn().mockResolvedValue(true),
        hashPassword: jest.fn().mockResolvedValue('password-hash'),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.use(cookieParser());
    app.useWebSocketAdapter(
      new RealtimeIoAdapter(app, 'http://localhost:3000'),
    );

    gateway = moduleFixture.get(RealtimeGateway);
    tokenService = moduleFixture.get(AuthTokenService);
    await app.listen(0, '127.0.0.1');
    const address = (app.getHttpServer() as HttpServer).address();
    if (!address || typeof address === 'string') {
      throw new Error('Expected the test server to listen on a TCP port');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(() => {
    sessions.clear();
    restaurantMemberships.mockClear();
  });

  afterEach(() => {
    for (const client of clients) client.disconnect();
    clients.clear();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('accepts a login access token and rejects missing or invalid tokens', async () => {
    const login = await loginViaHttp();
    const validClient = await connect(login.accessToken);

    expect(validClient.connected).toBe(true);
    expect(await connectError()).toBe('Unauthorized');
    expect(await connectError('not-a-jwt')).toBe('Unauthorized');
  });

  it('authorizes user and restaurant rooms from the authenticated identity', async () => {
    const ownerToken = await createAccessToken('user-1', 'owner@example.com');
    const customerToken = await createAccessToken(
      'user-2',
      'customer@example.com',
    );
    const [ownerClient, customerClient] = await Promise.all([
      connect(ownerToken),
      connect(customerToken),
    ]);

    const ownerRooms = gateway.server.sockets.get(
      getSocketId(ownerClient),
    )?.rooms;
    const customerRooms = gateway.server.sockets.get(
      getSocketId(customerClient),
    )?.rooms;

    expect(ownerRooms).toEqual(
      expect.objectContaining({
        has: expect.any(Function),
      }),
    );
    expect(ownerRooms?.has(`user:user-1`)).toBe(true);
    expect(ownerRooms?.has('restaurant:restaurant-1')).toBe(true);
    expect(ownerRooms?.has('user:user-2')).toBe(false);

    expect(customerRooms?.has('user:user-2')).toBe(true);
    expect(customerRooms?.has('restaurant:restaurant-1')).toBe(false);
    expect(restaurantMemberships).toHaveBeenCalledWith('user-1');
    expect(restaurantMemberships).toHaveBeenCalledWith('user-2');
  });

  it('rotates the refresh token and reconnects with the new access token', async () => {
    const login = await loginViaHttp();
    const firstClient = await connect(login.accessToken);
    const firstSocketId = getSocketId(firstClient);

    const refresh = await request(baseUrl)
      .post('/api/v1/auth/refresh')
      .set('Cookie', login.cookie)
      .expect(200);
    const rotatedCookie = getRefreshCookie(refresh.headers['set-cookie']);

    firstClient.disconnect();
    const reconnectedClient = await connect(
      (refresh.body as { accessToken: string }).accessToken,
    );

    expect(reconnectedClient.connected).toBe(true);
    expect(reconnectedClient.id).not.toBe(firstSocketId);
    expect(rotatedCookie).not.toBe(login.cookie);
    await request(baseUrl)
      .post('/api/v1/auth/refresh')
      .set('Cookie', login.cookie)
      .expect(401);
  });

  it('disconnects on logout and rejects the revoked refresh session', async () => {
    const login = await loginViaHttp();
    const client = await connect(login.accessToken);
    const socketId = getSocketId(client);

    await request(baseUrl)
      .post('/api/v1/auth/logout')
      .set('Cookie', login.cookie)
      .expect(204);

    // Mirrors RealtimeProvider reacting to the cleared browser auth store.
    client.disconnect();
    await waitForServerDisconnect(socketId);

    expect(client.connected).toBe(false);
    expect(gateway.server.sockets.has(socketId)).toBe(false);
    await request(baseUrl)
      .post('/api/v1/auth/refresh')
      .set('Cookie', login.cookie)
      .expect(401);
  });

  async function loginViaHttp(): Promise<{
    accessToken: string;
    cookie: string;
  }> {
    const response = await request(baseUrl)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'valid-password' })
      .expect(200);

    return {
      accessToken: (response.body as { accessToken: string }).accessToken,
      cookie: getRefreshCookie(response.headers['set-cookie']),
    };
  }

  function getRefreshCookie(header: string | string[] | undefined): string {
    const value = Array.isArray(header) ? header[0] : header;
    if (!value) throw new Error('Expected refresh-token cookie');
    return value.split(';')[0] ?? value;
  }

  function createAccessToken(id: string, email: string): Promise<string> {
    return tokenService.signAccessToken({
      id,
      email,
      roles: [{ role: { name: 'CUSTOMER' } }],
    });
  }

  function connect(token: string): Promise<TestSocket> {
    return new Promise((resolve, reject) => {
      const client = createClient(token);
      const timeout = setTimeout(() => {
        client.disconnect();
        reject(new Error('Timed out waiting for realtime:ready'));
      }, 3_000);

      client.once('realtime:ready', () => {
        clearTimeout(timeout);
        resolve(client);
      });
      client.once('connect_error', (error) => {
        clearTimeout(timeout);
        client.disconnect();
        reject(error);
      });
    });
  }

  function connectError(token?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = createClient(token);
      const timeout = setTimeout(() => {
        client.disconnect();
        reject(new Error('Timed out waiting for connection rejection'));
      }, 3_000);

      client.once('connect', () => {
        clearTimeout(timeout);
        client.disconnect();
        reject(new Error('Expected the connection to be rejected'));
      });
      client.once('connect_error', (error) => {
        clearTimeout(timeout);
        client.disconnect();
        resolve(error.message);
      });
    });
  }

  function createClient(token?: string): TestSocket {
    const client: TestSocket = io(`${baseUrl}/realtime`, {
      autoConnect: true,
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
      ...(token ? { auth: { token } } : {}),
    });
    clients.add(client);
    return client;
  }

  function getSocketId(client: TestSocket): string {
    if (!client.id) throw new Error('Expected a connected socket id');
    return client.id;
  }

  async function waitForServerDisconnect(socketId: string): Promise<void> {
    const deadline = Date.now() + 1_000;
    while (gateway.server.sockets.has(socketId)) {
      if (Date.now() >= deadline) {
        throw new Error('Timed out waiting for server-side disconnect');
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
});
