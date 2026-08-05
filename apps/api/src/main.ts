import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppEnvironment } from './config/env';
import { getLogLevels, logStartup } from './config/logger';

async function bootstrap(): Promise<void> {
  const environment = process.env.NODE_ENV ?? 'development';
  const app = await NestFactory.create(AppModule, {
    logger: getLogLevels(environment),
  });
  const config = app.get<ConfigService<AppEnvironment>>(ConfigService);
  const port = config.get('PORT', { infer: true }) ?? 3001;
  const clientUrl = config.get('CLIENT_URL', { infer: true });

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
  app.enableCors({
    origin: clientUrl,
    credentials: true,
  });
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.enableShutdownHooks();

  await app.listen(port);
  logStartup(new Logger('Bootstrap'), port, environment);
}

void bootstrap();
