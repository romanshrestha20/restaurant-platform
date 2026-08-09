import { LoggerService, LogLevel } from '@nestjs/common';

export function getLogLevels(environment: string): LogLevel[] {
  return environment === 'production'
    ? ['log', 'warn', 'error']
    : ['log', 'warn', 'error', 'debug', 'verbose'];
}

export function logStartup(
  logger: LoggerService,
  port: number,
  environment: string,
): void {
  logger.log(`API listening on http://localhost:${port}/api/v1`);
  logger.log(`Environment: ${environment}`);
}
