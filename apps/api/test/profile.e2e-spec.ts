import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AuthTokenService } from '../src/modules/auth/services/auth-token.service';
import { ProfileRepository } from '../src/modules/profile/profile.repository';
import { UploadService } from '../src/common/upload/upload.service';
import { PasswordService } from '../src/modules/auth/services/password.service';
import { PrismaService } from '../src/prisma/prisma.service';

const profile = {
  id: 'user-1',
  email: 'customer@example.com',
  phone: '+358401234567',
  emailVerified: true,
  phoneVerified: false,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  media: [
    {
      alt: 'Aino Korhonen profile photo',
      media: {
        url: 'https://res.cloudinary.com/example/image/upload/avatar.webp',
        publicId: 'restaurant-platform/profile-photos/avatar',
        fileName: 'avatar.webp',
        mimeType: 'image/webp',
        width: 800,
        height: 800,
        size: 42000,
        createdAt: new Date('2026-07-30T00:00:00.000Z'),
      },
    },
  ],
  profile: {
    firstName: 'Aino',
    lastName: 'Korhonen',
    bio: 'Always looking for the best seasonal menu.',
    gender: 'FEMALE' as const,
    dateOfBirth: new Date('1993-04-18T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-29T00:00:00.000Z'),
  },
};

describe('Profile API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: AuthTokenService;
  const findByUserId = jest.fn();
  const updateByUserId = jest.fn();
  const replacePhoto = jest.fn();
  const uploadImage = jest.fn();
  const deleteQuietly = jest.fn();
  const findPasswordByUserId = jest.fn();
  const changePasswordByUserId = jest.fn();
  const verifyPassword = jest.fn();
  const hashPassword = jest.fn();

  beforeEach(async () => {
    findByUserId.mockReset().mockResolvedValue(profile);
    updateByUserId.mockReset().mockResolvedValue(profile);
    replacePhoto.mockReset().mockResolvedValue({
      media: { id: 'new-media' },
      previousPublicId: 'restaurant-platform/profile-photos/old-avatar',
    });
    uploadImage.mockReset().mockResolvedValue({
      url: 'https://res.cloudinary.com/example/image/upload/new-avatar.webp',
      publicId: 'restaurant-platform/profile-photos/new-avatar',
      fileName: 'new-avatar.png',
      mimeType: 'image/png',
      width: 800,
      height: 800,
      size: 100,
    });
    deleteQuietly.mockReset().mockResolvedValue(undefined);
    findPasswordByUserId.mockReset().mockResolvedValue({
      id: 'user-1',
      passwordHash: 'current-password-hash',
    });
    changePasswordByUserId.mockReset().mockResolvedValue(true);
    verifyPassword.mockReset().mockResolvedValue(true);
    hashPassword.mockReset().mockResolvedValue('new-password-hash');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(ProfileRepository)
      .useValue({
        findByUserId,
        updateByUserId,
        replacePhoto,
        findPasswordByUserId,
        changePasswordByUserId,
      })
      .overrideProvider(UploadService)
      .useValue({
        uploadImage,
        deleteQuietly,
      })
      .overrideProvider(PasswordService)
      .useValue({ verifyPassword, hashPassword })
      .compile();

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
    tokenService = moduleFixture.get(AuthTokenService);
    await app.init();
  });

  const createToken = (id = 'user-1') =>
    tokenService.signAccessToken({
      id,
      email: 'customer@example.com',
      roles: [{ role: { name: 'CUSTOMER' } }],
    });

  it('requires authentication for profile reads and writes', async () => {
    await request(app.getHttpServer()).get('/api/v1/profile').expect(401);
    await request(app.getHttpServer()).patch('/api/v1/profile').expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/profile/photo')
      .expect(401);
    await request(app.getHttpServer())
      .patch('/api/v1/profile/password')
      .expect(401);
  });

  it('fetches fresh profile data only for the authenticated user', async () => {
    const token = await createToken('current-user');

    const response = await request(app.getHttpServer())
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(findByUserId).toHaveBeenCalledTimes(1);
    expect(findByUserId).toHaveBeenCalledWith('current-user');
    expect(response.body).toMatchObject({
      email: profile.email,
      emailVerified: true,
      phoneVerified: false,
      profile: {
        firstName: 'Aino',
        lastName: 'Korhonen',
        gender: 'FEMALE',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-07-29T00:00:00.000Z',
      },
      photo: {
        url: 'https://res.cloudinary.com/example/image/upload/avatar.webp',
        alt: 'Aino Korhonen profile photo',
        createdAt: '2026-07-30T00:00:00.000Z',
      },
      updatedAt: '2026-08-01T00:00:00.000Z',
    });
  });

  it('applies a valid partial update to the authenticated user', async () => {
    const token = await createToken();
    const update = {
      firstName: ' Aino-Maria ',
      phone: '+358501234567',
      bio: 'Seasonal menus and warm hospitality.',
      gender: 'FEMALE',
      dateOfBirth: '1993-04-18',
    };

    await request(app.getHttpServer())
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(update)
      .expect(200);

    expect(updateByUserId).toHaveBeenCalledWith('user-1', {
      ...update,
      firstName: 'Aino-Maria',
    });
  });

  it.each([
    [
      { firstName: '' },
      'firstName must be longer than or equal to 1 characters',
    ],
    [
      { lastName: 'x'.repeat(51) },
      'lastName must be shorter than or equal to 50 characters',
    ],
    [{ phone: '040 123 4567' }, 'phone must be in international format'],
    [
      { bio: 'x'.repeat(501) },
      'bio must be shorter than or equal to 500 characters',
    ],
    [{ gender: 'UNKNOWN' }, 'gender must be one of the following values'],
    [{ dateOfBirth: '2999-01-01' }, 'dateOfBirth must not be in the future'],
    [
      { dateOfBirth: 'not-a-date' },
      'dateOfBirth must be a valid ISO 8601 date string',
    ],
  ])('rejects invalid profile input %p', async (payload, message) => {
    const token = await createToken();

    const response = await request(app.getHttpServer())
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining(message)]),
    );
    expect(updateByUserId).not.toHaveBeenCalled();
  });

  it('returns a clear conflict when the phone number is already used', async () => {
    const token = await createToken();
    updateByUserId.mockRejectedValue({ code: 'P2002' });

    const response = await request(app.getHttpServer())
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+358501234567' })
      .expect(409);

    expect(response.body.message).toBe('Phone number is already in use');
  });

  it('uploads and replaces the authenticated user profile photo', async () => {
    const token = await createToken();
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    await request(app.getHttpServer())
      .post('/api/v1/profile/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', png, {
        filename: 'new-avatar.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(uploadImage).toHaveBeenCalledWith(
      expect.objectContaining({
        originalname: 'new-avatar.png',
        mimetype: 'image/png',
      }),
      {
        folder: 'avatars',
        width: 800,
        height: 800,
        crop: 'fill',
      },
    );
    expect(replacePhoto).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        publicId: 'restaurant-platform/profile-photos/new-avatar',
      }),
      'Aino Korhonen profile photo',
    );
    expect(deleteQuietly).toHaveBeenCalledWith(
      'restaurant-platform/profile-photos/old-avatar',
    );
  });

  it('rejects unsupported profile photo types', async () => {
    const token = await createToken();
    uploadImage.mockRejectedValue(
      new BadRequestException('Image must be JPEG, PNG, or WebP'),
    );

    await request(app.getHttpServer())
      .post('/api/v1/profile/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', Buffer.from('not an image'), {
        filename: 'avatar.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(uploadImage).toHaveBeenCalledWith(
      expect.objectContaining({ mimetype: 'text/plain' }),
      expect.objectContaining({ folder: 'avatars' }),
    );
  });

  it('changes the password, revokes sessions, and clears the refresh cookie', async () => {
    const token = await createToken();

    const response = await request(app.getHttpServer())
      .patch('/api/v1/profile/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'current-password',
        newPassword: 'new-secure-password',
        confirmPassword: 'new-secure-password',
      })
      .expect(200);

    expect(verifyPassword).toHaveBeenCalledWith(
      'current-password',
      'current-password-hash',
    );
    expect(hashPassword).toHaveBeenCalledWith('new-secure-password');
    expect(changePasswordByUserId).toHaveBeenCalledWith(
      'user-1',
      'new-password-hash',
    );
    expect(response.body).toEqual({
      message: 'Password changed successfully. Please sign in again.',
    });
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('refreshToken=;')]),
    );
  });

  it('rejects an incorrect current password', async () => {
    const token = await createToken();
    verifyPassword.mockResolvedValue(false);

    const response = await request(app.getHttpServer())
      .patch('/api/v1/profile/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'incorrect-password',
        newPassword: 'new-secure-password',
        confirmPassword: 'new-secure-password',
      })
      .expect(400);

    expect(response.body.message).toBe('Current password is incorrect');
    expect(hashPassword).not.toHaveBeenCalled();
    expect(changePasswordByUserId).not.toHaveBeenCalled();
  });

  it.each([
    [
      {
        currentPassword: 'current-password',
        newPassword: 'too-short',
        confirmPassword: 'too-short',
      },
      'newPassword must be longer than or equal to 12 characters',
    ],
    [
      {
        currentPassword: 'current-password',
        newPassword: 'new-secure-password',
        confirmPassword: 'different-password',
      },
      'confirmPassword must match newPassword',
    ],
  ])('validates password change input', async (payload, message) => {
    const token = await createToken();

    const response = await request(app.getHttpServer())
      .patch('/api/v1/profile/password')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining(message)]),
    );
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  afterEach(async () => {
    await app?.close();
  });
});
