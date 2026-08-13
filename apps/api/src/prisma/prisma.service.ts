import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { normalizePostgresSslMode } from '@restaurant/database/connection-url';
import { PrismaClient } from '@restaurant/database/generated';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnApplicationShutdown
{
  constructor(config: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: normalizePostgresSslMode(
        config.getOrThrow<string>('DATABASE_URL'),
      ),
    });

    super({ adapter });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
