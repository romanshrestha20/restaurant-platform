import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEnvironment } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const createService = (queryRaw: jest.Mock, timeoutMs = 3_000) => {
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
    const config = {
      get: jest.fn().mockReturnValue(timeoutMs),
    } as unknown as ConfigService<AppEnvironment, true>;

    return { prisma, service: new HealthService(prisma, config) };
  };

  it('reports liveness without touching the database', () => {
    const { prisma, service } = createService(jest.fn());

    expect(service.getLiveness()).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      uptimeSeconds: expect.any(Number),
    });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('reports readiness after the database responds', async () => {
    const { service } = createService(
      jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    );

    await expect(service.getReadiness()).resolves.toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      uptimeSeconds: expect.any(Number),
      checks: { database: 'up' },
    });
  });

  it('returns service unavailable when the database rejects', async () => {
    const { service } = createService(
      jest.fn().mockRejectedValue(new Error('connection refused')),
    );

    await expect(service.getReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('returns service unavailable when the database check times out', async () => {
    const neverResolves = new Promise<never>(() => undefined);
    const { service } = createService(
      jest.fn().mockReturnValue(neverResolves),
      1,
    );

    await expect(service.getReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
