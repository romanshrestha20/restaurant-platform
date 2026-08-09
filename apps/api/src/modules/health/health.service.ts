import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEnvironment } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';

export interface HealthStatus {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}

export interface ReadinessStatus extends HealthStatus {
  checks: {
    database: 'up';
  };
}

@Injectable()
export class HealthService {
  private readonly databaseTimeoutMs: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.databaseTimeoutMs = config.get('HEALTH_DATABASE_TIMEOUT_MS', {
      infer: true,
    });
  }

  getLiveness(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async getReadiness(): Promise<ReadinessStatus> {
    let timeout: NodeJS.Timeout | undefined;

    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(
            () => reject(new Error('Database health check timed out')),
            this.databaseTimeoutMs,
          );
        }),
      ]);
    } catch {
      throw new ServiceUnavailableException({
        message: 'Database readiness check failed',
        error: 'Service Unavailable',
        details: {
          checks: { database: 'down' },
        },
      });
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }

    return {
      ...this.getLiveness(),
      checks: { database: 'up' },
    };
  }
}
