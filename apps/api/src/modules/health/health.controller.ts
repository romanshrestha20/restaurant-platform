import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';
import type { HealthStatus, ReadinessStatus } from './health.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getLiveness(): HealthStatus {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  getReadiness(): Promise<ReadinessStatus> {
    return this.healthService.getReadiness();
  }
}
