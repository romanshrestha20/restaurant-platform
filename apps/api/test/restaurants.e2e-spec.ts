import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DayOfWeek, RestaurantMediaType } from '@restaurant/database/generated';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { UploadService } from '../src/common/upload/upload.service';
import { AuthTokenService } from '../src/modules/auth/services/auth-token.service';
import { RestaurantsRepository } from '../src/modules/restaurants/restaurants.repository';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Restaurant onboarding API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: AuthTokenService;
  const createForOwner = jest.fn();
  const findMembership = jest.fn();
  const findMembershipsByUserId = jest.fn();
  const findManagementById = jest.fn();
  const updateById = jest.fn();
  const replaceOpeningHours = jest.fn();
  const listAddresses = jest.fn();
  const addAddress = jest.fn();
  const updateAddress = jest.fn();
  const deleteAddress = jest.fn();
  const replaceMedia = jest.fn();
  const removeMedia = jest.fn();
  const uploadImage = jest.fn();
  const deleteQuietly = jest.fn();

  const primaryAddress = {
    id: 'address-1',
    label: 'Primary',
    street: 'Aleksanterinkatu 12',
    city: 'Helsinki',
    state: null,
    postalCode: '00100',
    country: 'FI',
    latitude: null,
    longitude: null,
    isPrimary: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const managementRestaurant = {
    id: 'restaurant-1',
    name: 'Nordic Table',
    slug: 'nordic-table',
    description: 'Seasonal Nordic cooking.',
    email: 'hello@nordictable.example',
    phone: '+358401234567',
    currency: 'EUR',
    timezone: 'Europe/Helsinki',
    isActive: true,
    status: 'ACTIVE' as const,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    addresses: [primaryAddress],
    openingHours: [],
    settings: {
      acceptsOrders: true,
      acceptsReservations: true,
    },
    media: [],
  };

  beforeEach(async () => {
    findMembership.mockReset().mockResolvedValue({
      role: { name: 'OWNER' },
      restaurant: { isActive: true, deletedAt: null },
    });
    findMembershipsByUserId.mockReset().mockResolvedValue([
      {
        joinedAt: new Date('2026-01-01T00:00:00.000Z'),
        role: { name: 'OWNER' },
        restaurant: managementRestaurant,
      },
    ]);
    findManagementById.mockReset().mockResolvedValue(managementRestaurant);
    updateById.mockReset().mockResolvedValue(managementRestaurant);
    replaceOpeningHours.mockReset().mockResolvedValue([]);
    listAddresses.mockReset().mockResolvedValue([primaryAddress]);
    addAddress.mockReset().mockResolvedValue({
      ...primaryAddress,
      id: 'address-2',
      label: 'Kitchen entrance',
      isPrimary: false,
    });
    updateAddress.mockReset().mockResolvedValue({
      ...primaryAddress,
      label: 'Main entrance',
    });
    deleteAddress.mockReset().mockResolvedValue(true);
    replaceMedia.mockReset().mockImplementation((_restaurantId, type) => ({
      type,
      media: {
        url: 'https://example.com/restaurant.webp',
        publicId: `restaurants/restaurant-1/${String(type).toLowerCase()}/new`,
        fileName: 'restaurant.png',
        mimeType: 'image/png',
        width: type === RestaurantMediaType.LOGO ? 800 : 1600,
        height: type === RestaurantMediaType.LOGO ? 800 : 900,
        size: 100,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      previousPublicId: null,
    }));
    removeMedia.mockReset().mockResolvedValue('restaurants/old-image');
    uploadImage.mockReset().mockResolvedValue({
      url: 'https://example.com/restaurant.webp',
      publicId: 'restaurants/restaurant-1/image/new',
      fileName: 'restaurant.png',
      mimeType: 'image/png',
      width: 800,
      height: 800,
      size: 100,
    });
    deleteQuietly.mockReset().mockResolvedValue(undefined);
    createForOwner.mockReset().mockResolvedValue({
      ...managementRestaurant,
      callerRole: 'OWNER',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        restaurantMember: { findUnique: findMembership },
      })
      .overrideProvider(RestaurantsRepository)
      .useValue({
        createForOwner,
        findMembershipsByUserId,
        findManagementById,
        updateById,
        replaceOpeningHours,
        listAddresses,
        addAddress,
        updateAddress,
        deleteAddress,
        replaceMedia,
        removeMedia,
      })
      .overrideProvider(UploadService)
      .useValue({ uploadImage, deleteQuietly })
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

  const createToken = () =>
    tokenService.signAccessToken({
      id: 'user-1',
      email: 'owner@example.com',
      roles: [{ role: { name: 'CUSTOMER' } }],
    });

  const validPayload = {
    name: ' Nordic Table ',
    description: 'Seasonal Nordic cooking.',
    email: 'HELLO@NORDICTABLE.EXAMPLE',
    phone: '+358401234567',
    currency: 'eur',
    timezone: 'Europe/Helsinki',
    primaryAddress: {
      label: ' Primary ',
      street: ' Aleksanterinkatu 12 ',
      city: ' Helsinki ',
      postalCode: '00100',
      country: 'fi',
      latitude: 60.1699,
      longitude: 24.9384,
    },
    openingHours: [],
  };

  it('requires authentication without requiring an existing membership', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/restaurants')
      .send(validPayload)
      .expect(401);
  });

  it('creates a restaurant and returns the caller OWNER role', async () => {
    const token = await createToken();

    const response = await request(app.getHttpServer())
      .post('/api/v1/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload)
      .expect(201);

    expect(createForOwner).toHaveBeenCalledWith(
      'user-1',
      'nordic-table',
      expect.objectContaining({
        name: 'Nordic Table',
        email: 'hello@nordictable.example',
        currency: 'EUR',
        primaryAddress: expect.objectContaining({
          label: 'Primary',
          country: 'FI',
        }),
      }),
    );
    expect(response.body).toMatchObject({
      id: 'restaurant-1',
      callerRole: 'OWNER',
      addresses: [{ isPrimary: true }],
    });
  });

  it('accepts a complete seven-day schedule', async () => {
    const token = await createToken();
    const openingHours = Object.values(DayOfWeek).map((day) => ({
      day,
      isClosed: false,
      opensAt: '09:00',
      closesAt: '22:00',
    }));

    await request(app.getHttpServer())
      .post('/api/v1/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, openingHours })
      .expect(201);

    expect(createForOwner).toHaveBeenCalledWith(
      'user-1',
      'nordic-table',
      expect.objectContaining({ openingHours }),
    );
  });

  it('rejects a partial weekly schedule', async () => {
    const token = await createToken();

    const response = await request(app.getHttpServer())
      .post('/api/v1/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...validPayload,
        openingHours: [
          {
            day: DayOfWeek.MONDAY,
            isClosed: false,
            opensAt: '09:00',
            closesAt: '22:00',
          },
        ],
      })
      .expect(400);

    expect(response.body.message).toContain(
      'openingHours must be empty or contain exactly one entry for every weekday',
    );
    expect(createForOwner).not.toHaveBeenCalled();
  });

  it('rejects times on a closed weekday', async () => {
    const token = await createToken();
    const openingHours = Object.values(DayOfWeek).map((day) => ({
      day,
      isClosed: day === DayOfWeek.SUNDAY,
      opensAt: '09:00',
      closesAt: '22:00',
    }));

    const response = await request(app.getHttpServer())
      .post('/api/v1/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, openingHours })
      .expect(400);

    expect(response.body.message).toContain(
      'SUNDAY must not include opening or closing times when closed',
    );
  });

  it('returns a conflict when the public slug is already used', async () => {
    const token = await createToken();
    createForOwner.mockRejectedValue({ code: 'P2002' });

    const response = await request(app.getHttpServer())
      .post('/api/v1/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPayload, slug: 'nordic-table' })
      .expect(409);

    expect(response.body.message).toBe('Restaurant slug is already in use');
  });

  it('lists only the authenticated user memberships', async () => {
    const token = await createToken();

    const response = await request(app.getHttpServer())
      .get('/api/v1/restaurants')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(findMembershipsByUserId).toHaveBeenCalledWith('user-1');
    expect(response.body[0]).toMatchObject({
      callerRole: 'OWNER',
      restaurant: { id: 'restaurant-1' },
    });
  });

  it('allows any restaurant member to read management details and addresses', async () => {
    const token = await createToken();
    findMembership.mockResolvedValue({
      role: { name: 'WAITER' },
      restaurant: { isActive: true, deletedAt: null },
    });

    const details = await request(app.getHttpServer())
      .get('/api/v1/restaurants/restaurant-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const addresses = await request(app.getHttpServer())
      .get('/api/v1/restaurants/restaurant-1/addresses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(details.body).toMatchObject({
      id: 'restaurant-1',
      callerRole: 'WAITER',
    });
    expect(addresses.body).toHaveLength(1);
  });

  it('denies cross-tenant access before invoking restaurant services', async () => {
    const token = await createToken();
    findMembership.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/api/v1/restaurants/another-restaurant')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(findManagementById).not.toHaveBeenCalled();
  });

  it('denies staff access to every management write family', async () => {
    const token = await createToken();
    findMembership.mockResolvedValue({
      role: { name: 'WAITER' },
      restaurant: { isActive: true, deletedAt: null },
    });
    const authorization = { Authorization: `Bearer ${token}` };

    await request(app.getHttpServer())
      .patch('/api/v1/restaurants/restaurant-1')
      .set(authorization)
      .send({ name: 'New name' })
      .expect(403);
    await request(app.getHttpServer())
      .put('/api/v1/restaurants/restaurant-1/opening-hours')
      .set(authorization)
      .send({ openingHours: [] })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/restaurants/restaurant-1/addresses')
      .set(authorization)
      .send(validPayload.primaryAddress)
      .expect(403);
    await request(app.getHttpServer())
      .patch('/api/v1/restaurants/restaurant-1/addresses/address-1')
      .set(authorization)
      .send({ label: 'Updated' })
      .expect(403);
    await request(app.getHttpServer())
      .delete('/api/v1/restaurants/restaurant-1/addresses/address-1')
      .set(authorization)
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/restaurants/restaurant-1/logo')
      .set(authorization)
      .expect(403);
    await request(app.getHttpServer())
      .delete('/api/v1/restaurants/restaurant-1/logo')
      .set(authorization)
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/restaurants/restaurant-1/cover')
      .set(authorization)
      .expect(403);
    await request(app.getHttpServer())
      .delete('/api/v1/restaurants/restaurant-1/cover')
      .set(authorization)
      .expect(403);

    expect(updateById).not.toHaveBeenCalled();
    expect(replaceOpeningHours).not.toHaveBeenCalled();
    expect(addAddress).not.toHaveBeenCalled();
    expect(replaceMedia).not.toHaveBeenCalled();
  });

  it('allows a manager to update details, schedules, and addresses', async () => {
    const token = await createToken();
    findMembership.mockResolvedValue({
      role: { name: 'MANAGER' },
      restaurant: { isActive: true, deletedAt: null },
    });
    const authorization = { Authorization: `Bearer ${token}` };

    const updated = await request(app.getHttpServer())
      .patch('/api/v1/restaurants/restaurant-1')
      .set(authorization)
      .send({ name: ' Nordic Table Helsinki ', currency: 'usd' })
      .expect(200);
    await request(app.getHttpServer())
      .put('/api/v1/restaurants/restaurant-1/opening-hours')
      .set(authorization)
      .send({ openingHours: [] })
      .expect(200, { openingHours: [] });
    await request(app.getHttpServer())
      .post('/api/v1/restaurants/restaurant-1/addresses')
      .set(authorization)
      .send({
        label: 'Kitchen entrance',
        street: 'Kluuvikatu 1',
        city: 'Helsinki',
        country: 'fi',
      })
      .expect(201);
    await request(app.getHttpServer())
      .patch('/api/v1/restaurants/restaurant-1/addresses/address-1')
      .set(authorization)
      .send({ label: ' Main entrance ' })
      .expect(200);
    await request(app.getHttpServer())
      .delete('/api/v1/restaurants/restaurant-1/addresses/address-2')
      .set(authorization)
      .expect(204);

    expect(updated.body.callerRole).toBe('MANAGER');
    expect(updateById).toHaveBeenCalledWith('restaurant-1', {
      name: 'Nordic Table Helsinki',
      currency: 'USD',
    });
    expect(addAddress).toHaveBeenCalledWith(
      'restaurant-1',
      expect.objectContaining({ country: 'FI' }),
    );
    expect(updateAddress).toHaveBeenCalledWith('restaurant-1', 'address-1', {
      label: 'Main entrance',
    });
    expect(deleteAddress).toHaveBeenCalledWith('restaurant-1', 'address-2');
  });

  it('uploads, replaces, and removes logo and cover assets', async () => {
    const token = await createToken();
    const authorization = { Authorization: `Bearer ${token}` };
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    await request(app.getHttpServer())
      .post('/api/v1/restaurants/restaurant-1/logo')
      .set(authorization)
      .attach('logo', png, { filename: 'logo.png', contentType: 'image/png' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/restaurants/restaurant-1/cover')
      .set(authorization)
      .attach('cover', png, { filename: 'cover.png', contentType: 'image/png' })
      .expect(201);
    await request(app.getHttpServer())
      .delete('/api/v1/restaurants/restaurant-1/logo')
      .set(authorization)
      .expect(204);
    await request(app.getHttpServer())
      .delete('/api/v1/restaurants/restaurant-1/cover')
      .set(authorization)
      .expect(204);

    expect(uploadImage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ originalname: 'logo.png' }),
      expect.objectContaining({ width: 800, height: 800, crop: 'fill' }),
    );
    expect(uploadImage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ originalname: 'cover.png' }),
      expect.objectContaining({ width: 1600, height: 900, crop: 'fill' }),
    );
    expect(replaceMedia).toHaveBeenCalledWith(
      'restaurant-1',
      RestaurantMediaType.LOGO,
      expect.any(Object),
    );
    expect(replaceMedia).toHaveBeenCalledWith(
      'restaurant-1',
      RestaurantMediaType.COVER,
      expect.any(Object),
    );
    expect(removeMedia).toHaveBeenCalledTimes(2);
    expect(deleteQuietly).toHaveBeenCalledWith('restaurants/old-image');
  });

  afterEach(async () => {
    await app?.close();
  });
});
