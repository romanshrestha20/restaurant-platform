import { DayOfWeek } from '@restaurant/database/generated';
import type { PrismaService } from '../../prisma/prisma.service';
import type { CreateRestaurantDto } from './dto/create-restaurant.dto';
import {
  CannotDeleteLastAddressError,
  CannotUnsetPrimaryAddressError,
  OnboardingUserNotFoundError,
  OwnerRoleNotConfiguredError,
  RestaurantsRepository,
} from './restaurants.repository';

describe('RestaurantsRepository', () => {
  const findRole = jest.fn();
  const findUser = jest.fn();
  const createRestaurant = jest.fn();
  const findRestaurant = jest.fn();
  const updateRestaurants = jest.fn();
  const findUniqueRestaurant = jest.fn();
  const deleteOpeningHours = jest.fn();
  const createOpeningHours = jest.fn();
  const findOpeningHours = jest.fn();
  const findAddress = jest.fn();
  const countAddresses = jest.fn();
  const updateAddresses = jest.fn();
  const createAddress = jest.fn();
  const updateAddress = jest.fn();
  const deleteAddress = jest.fn();
  const findRestaurantMedia = jest.fn();
  const findFirstRestaurantMedia = jest.fn();
  const deleteRestaurantMedia = jest.fn();
  const createMedia = jest.fn();
  const deleteMedia = jest.fn();
  const transaction = {
    role: { findUnique: findRole },
    user: { findFirst: findUser },
    restaurant: {
      create: createRestaurant,
      findFirst: findRestaurant,
      updateMany: updateRestaurants,
      findUnique: findUniqueRestaurant,
    },
    openingHour: {
      deleteMany: deleteOpeningHours,
      createMany: createOpeningHours,
      findMany: findOpeningHours,
    },
    restaurantAddress: {
      findFirst: findAddress,
      count: countAddresses,
      updateMany: updateAddresses,
      create: createAddress,
      update: updateAddress,
      delete: deleteAddress,
    },
    restaurantMedia: {
      findUnique: findRestaurantMedia,
      findFirst: findFirstRestaurantMedia,
      delete: deleteRestaurantMedia,
    },
    media: { create: createMedia, delete: deleteMedia },
  };
  const runTransaction = jest.fn(
    (callback: (client: typeof transaction) => unknown) =>
      callback(transaction),
  );
  const repository = new RestaurantsRepository({
    $transaction: runTransaction,
  } as unknown as PrismaService);

  const schedule = Object.values(DayOfWeek).map((day, index) => ({
    day,
    isClosed: index === 6,
    ...(index === 6 ? {} : { opensAt: '09:00', closesAt: '22:00' }),
  }));
  const data: CreateRestaurantDto = {
    name: 'Nordic Table',
    description: 'Seasonal food',
    currency: 'EUR',
    timezone: 'Europe/Helsinki',
    primaryAddress: {
      label: 'Primary',
      street: 'Aleksanterinkatu 12',
      city: 'Helsinki',
      postalCode: '00100',
      country: 'FI',
    },
    openingHours: schedule,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    findRestaurant.mockReset();
    updateRestaurants.mockReset();
    findUniqueRestaurant.mockReset();
    deleteOpeningHours.mockReset();
    createOpeningHours.mockReset();
    findOpeningHours.mockReset();
    findAddress.mockReset();
    countAddresses.mockReset();
    updateAddresses.mockReset();
    createAddress.mockReset();
    updateAddress.mockReset();
    deleteAddress.mockReset();
    findRestaurantMedia.mockReset();
    findFirstRestaurantMedia.mockReset();
    deleteRestaurantMedia.mockReset();
    createMedia.mockReset();
    deleteMedia.mockReset();
    findRole.mockResolvedValue({ id: 'owner-role' });
    findUser.mockResolvedValue({ id: 'user-1' });
    createRestaurant.mockResolvedValue({
      id: 'restaurant-1',
      name: data.name,
      slug: 'nordic-table',
    });
  });

  it('creates the restaurant and all onboarding relations atomically', async () => {
    const result = await repository.createForOwner(
      'user-1',
      'nordic-table',
      data,
    );

    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(findRole).toHaveBeenCalledWith({
      where: { name: 'OWNER' },
      select: { id: true },
    });
    expect(findUser).toHaveBeenCalledWith({
      where: { id: 'user-1', isActive: true, deletedAt: null },
      select: { id: true },
    });
    expect(createRestaurant).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Nordic Table',
          slug: 'nordic-table',
          settings: { create: {} },
          addresses: {
            create: expect.objectContaining({
              street: 'Aleksanterinkatu 12',
              isPrimary: true,
            }),
          },
          members: {
            create: { userId: 'user-1', roleId: 'owner-role' },
          },
          openingHours: {
            create: expect.arrayContaining([
              {
                day: DayOfWeek.SUNDAY,
                isClosed: true,
                opensAt: null,
                closesAt: null,
              },
            ]),
          },
        }),
      }),
    );
    expect(result).toMatchObject({
      id: 'restaurant-1',
      callerRole: 'OWNER',
    });
  });

  it('creates an explicitly empty schedule without opening-hour writes', async () => {
    await repository.createForOwner('user-1', 'nordic-table', {
      ...data,
      openingHours: [],
    });

    expect(createRestaurant).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ openingHours: expect.anything() }),
      }),
    );
  });

  it('stops before writing when the OWNER role is not configured', async () => {
    findRole.mockResolvedValue(null);

    await expect(
      repository.createForOwner('user-1', 'nordic-table', data),
    ).rejects.toBeInstanceOf(OwnerRoleNotConfiguredError);
    expect(createRestaurant).not.toHaveBeenCalled();
  });

  it('stops before writing when the authenticated user is inactive', async () => {
    findUser.mockResolvedValue(null);

    await expect(
      repository.createForOwner('user-1', 'nordic-table', data),
    ).rejects.toBeInstanceOf(OnboardingUserNotFoundError);
    expect(createRestaurant).not.toHaveBeenCalled();
  });

  it('switches the primary address inside the add-address transaction', async () => {
    findRestaurant.mockResolvedValue({ _count: { addresses: 1 } });
    createAddress.mockResolvedValue({ id: 'address-2', isPrimary: true });

    const result = await repository.addAddress('restaurant-1', {
      label: 'Second entrance',
      street: 'Kluuvikatu 1',
      city: 'Helsinki',
      country: 'FI',
      isPrimary: true,
    });

    expect(updateAddresses).toHaveBeenCalledWith({
      where: { restaurantId: 'restaurant-1', isPrimary: true },
      data: { isPrimary: false },
    });
    expect(createAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          restaurantId: 'restaurant-1',
          isPrimary: true,
        }),
      }),
    );
    expect(result).toEqual({ id: 'address-2', isPrimary: true });
  });

  it('prevents directly unsetting the primary address', async () => {
    findAddress.mockResolvedValue({ id: 'address-1', isPrimary: true });

    await expect(
      repository.updateAddress('restaurant-1', 'address-1', {
        isPrimary: false,
      }),
    ).rejects.toBeInstanceOf(CannotUnsetPrimaryAddressError);
    expect(updateAddress).not.toHaveBeenCalled();
  });

  it('prevents deletion of the final restaurant address', async () => {
    findAddress.mockResolvedValue({ id: 'address-1', isPrimary: true });
    countAddresses.mockResolvedValue(1);

    await expect(
      repository.deleteAddress('restaurant-1', 'address-1'),
    ).rejects.toBeInstanceOf(CannotDeleteLastAddressError);
    expect(deleteAddress).not.toHaveBeenCalled();
  });

  it('promotes a replacement when deleting the primary address', async () => {
    findAddress
      .mockResolvedValueOnce({ id: 'address-1', isPrimary: true })
      .mockResolvedValueOnce({ id: 'address-2' });
    countAddresses.mockResolvedValue(2);

    await expect(
      repository.deleteAddress('restaurant-1', 'address-1'),
    ).resolves.toBe(true);

    expect(deleteAddress).toHaveBeenCalledWith({
      where: { id: 'address-1' },
    });
    expect(updateAddress).toHaveBeenCalledWith({
      where: { id: 'address-2' },
      data: { isPrimary: true },
    });
  });

  it('replaces typed media in one database transaction', async () => {
    findRestaurant.mockResolvedValue({
      id: 'restaurant-1',
      name: 'Nordic Table',
    });
    findRestaurantMedia.mockResolvedValue({
      mediaId: 'old-media',
      media: { publicId: 'restaurants/old-logo' },
    });
    createMedia.mockResolvedValue({
      url: 'https://example.com/new-logo.webp',
      publicId: 'restaurants/new-logo',
    });

    const result = await repository.replaceMedia('restaurant-1', 'LOGO', {
      url: 'https://example.com/new-logo.webp',
      publicId: 'restaurants/new-logo',
      fileName: 'logo.png',
      mimeType: 'image/png',
      width: 800,
      height: 800,
      size: 100,
    });

    expect(deleteRestaurantMedia).toHaveBeenCalled();
    expect(deleteMedia).toHaveBeenCalledWith({ where: { id: 'old-media' } });
    expect(createMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          restaurants: {
            create: expect.objectContaining({ type: 'LOGO' }),
          },
        }),
      }),
    );
    expect(result).toMatchObject({
      type: 'LOGO',
      previousPublicId: 'restaurants/old-logo',
    });
  });
});
