import { INestApplication, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AuthTokenService } from '../src/modules/auth/services/auth-token.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Role authorization (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: AuthTokenService;
  const findMembership = jest.fn();

  beforeEach(async () => {
    findMembership.mockReset();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        restaurantMember: { findUnique: findMembership },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    tokenService = moduleFixture.get(AuthTokenService);
    await app.init();
  });

  const createToken = (role: 'ADMIN' | 'CUSTOMER') =>
    tokenService.signAccessToken({
      id: 'user-1',
      email: 'user@example.com',
      roles: [{ role: { name: role } }],
    });

  it('returns 401 when the platform endpoint has no access token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/platform/admin')
      .expect(401);
  });

  it('returns 403 when a customer accesses the platform-admin endpoint', async () => {
    const token = await createToken('CUSTOMER');

    await request(app.getHttpServer())
      .get('/api/v1/auth/platform/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('allows a platform administrator', async () => {
    const token = await createToken('ADMIN');

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/platform/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      userId: 'user-1',
      role: 'ADMIN',
      authorized: true,
    });
  });

  it('allows an owner only for their restaurant membership', async () => {
    const token = await createToken('CUSTOMER');
    findMembership.mockResolvedValue({
      role: { name: 'OWNER' },
      restaurant: { isActive: true, deletedAt: null },
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/restaurants/restaurant-1/management')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(findMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          restaurantId_userId: {
            restaurantId: 'restaurant-1',
            userId: 'user-1',
          },
        },
      }),
    );
    expect(response.body).toEqual({
      restaurantId: 'restaurant-1',
      userId: 'user-1',
      role: 'OWNER',
      authorized: true,
    });
  });

  it('denies a restaurant role without management permission', async () => {
    const token = await createToken('CUSTOMER');
    findMembership.mockResolvedValue({
      role: { name: 'WAITER' },
      restaurant: { isActive: true, deletedAt: null },
    });

    await request(app.getHttpServer())
      .get('/api/v1/auth/restaurants/restaurant-1/management')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  afterEach(async () => {
    await app?.close();
  });
});
