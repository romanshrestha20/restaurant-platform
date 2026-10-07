import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'node:path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppEnvironment } from './config/env';
import { getLogLevels, logStartup } from './config/logger';
import { createSameOriginMiddleware } from './common/security/same-origin.middleware';
import { createOriginPolicy } from './common/security/origin-policy';
import { RealtimeIoAdapter } from './common/realtime';
import { requestIdMiddleware } from './common/http/request-id.middleware';

async function bootstrap(): Promise<void> {
  const environment = process.env.NODE_ENV ?? 'development';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: getLogLevels(environment),
    rawBody: true,
  });
  const config = app.get<ConfigService<AppEnvironment, true>>(ConfigService);
  const port = config.get('PORT', { infer: true }) ?? 3001;
  const clientUrl = config.get('CLIENT_URL', { infer: true });
  const isAllowedOrigin = createOriginPolicy({
    clientUrl,
    platformDomain: config.get('PLATFORM_DOMAIN', { infer: true }),
    customDomains: config.get('CUSTOM_DOMAINS', { infer: true }),
    isProduction: environment === 'production',
  });
  // Storefronts reach the API through their own /api rewrite, so the client IP
  // used for throttling and login history arrives in X-Forwarded-For.
  app.set('trust proxy', config.get('TRUST_PROXY_HOPS', { infer: true }));

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
    origin: (origin, callback) =>
      callback(null, !origin || isAllowedOrigin(origin)),
    credentials: true,
  });
  app.use(requestIdMiddleware);
  app.useWebSocketAdapter(new RealtimeIoAdapter(app, isAllowedOrigin));
  app.use(createSameOriginMiddleware(isAllowedOrigin));
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  if (config.get('UPLOAD_STORAGE_PROVIDER', { infer: true }) === 'local') {
    app.useStaticAssets(
      resolve(process.cwd(), config.get('UPLOAD_LOCAL_DIR', { infer: true })),
      { prefix: '/uploads/' },
    );
  }
  app.enableShutdownHooks();

  await app.listen(port);
  logStartup(new Logger('Bootstrap'), port, environment);
}

void bootstrap();
