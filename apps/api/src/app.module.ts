import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { envValidationSchema } from './config/env';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      cache: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
