import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/modules/auth/controllers/auth.controller';
import { AccountRecoveryService } from '../src/modules/auth/services/account-recovery.service';
import { AuthService } from '../src/modules/auth/services/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Account recovery API (e2e)', () => {
  let app: INestApplication<App>;
  const accountRecovery = {
    requestPasswordReset: jest.fn().mockResolvedValue({
      message:
        'If an account exists for that email, a reset link has been sent',
    }),
    resetPassword: jest.fn().mockResolvedValue({
      message: 'Password reset successfully. Please sign in again',
    }),
    verifyEmail: jest
      .fn()
      .mockResolvedValue({ message: 'Email verified successfully' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: AccountRecoveryService, useValue: accountRecovery },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(), getOrThrow: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: { restaurantMember: { findUnique: jest.fn() } },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
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
    await app.init();
  });

  it('POST /auth/password/forgot normalizes through the service', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/password/forgot')
      .send({ email: 'Customer@Example.com' })
      .expect(200);

    expect(response.body).toEqual({
      message:
        'If an account exists for that email, a reset link has been sent',
    });
    expect(accountRecovery.requestPasswordReset).toHaveBeenCalledWith(
      'Customer@Example.com',
    );
  });

  it('rejects malformed reset tokens before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/password/reset')
      .send({ token: 'short-token', password: 'new-secure-password' })
      .expect(400);

    expect(accountRecovery.resetPassword).not.toHaveBeenCalled();
  });

  it('accepts valid reset and verification payloads', async () => {
    const token = 'a'.repeat(64);

    await request(app.getHttpServer())
      .post('/api/v1/auth/password/reset')
      .send({ token, password: 'new-secure-password' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/auth/email-verification/confirm')
      .send({ token })
      .expect(200);

    expect(accountRecovery.resetPassword).toHaveBeenCalledWith(
      token,
      'new-secure-password',
    );
    expect(accountRecovery.verifyEmail).toHaveBeenCalledWith(token);
  });

  afterAll(async () => {
    await app?.close();
  });
});
