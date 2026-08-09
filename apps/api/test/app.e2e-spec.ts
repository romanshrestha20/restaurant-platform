import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Health API (e2e)', () => {
  let app: INestApplication<App>;
  const queryRaw = jest.fn();

  beforeEach(async () => {
    queryRaw.mockReset().mockResolvedValue([{ '?column?': 1 }]);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: queryRaw })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();
  });

  it('GET /api/v1/health', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      uptimeSeconds: expect.any(Number),
    });
    expect(response.headers).not.toHaveProperty('x-ratelimit-limit');
  });

  it('GET /api/v1/health/ready reports database readiness', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      uptimeSeconds: expect.any(Number),
      checks: { database: 'up' },
    });
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(response.headers).not.toHaveProperty('x-ratelimit-limit');
  });

  it('GET /api/v1/health/ready returns 503 when the database is down', async () => {
    queryRaw.mockRejectedValue(new Error('connection refused'));

    const response = await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(503);

    expect(response.body).toEqual({
      statusCode: 503,
      message: 'Database readiness check failed',
      error: 'Service Unavailable',
      details: { checks: { database: 'down' } },
      path: '/api/v1/health/ready',
      timestamp: expect.any(String),
    });
  });

  afterEach(async () => {
    await app?.close();
  });
});
