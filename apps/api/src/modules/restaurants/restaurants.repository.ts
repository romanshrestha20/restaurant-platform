import { Injectable } from '@nestjs/common';
import { RestaurantMediaType } from '@restaurant/database/generated';
import { restaurantPermissionsForRole } from '@restaurant/database/authorization';
import type { UploadResult } from '../../common/upload/types/upload-result.type';
import { PrismaService } from '../../prisma/prisma.service';
import type { AddRestaurantAddressDto } from './dto/add-restaurant-address.dto';
import type { CreateRestaurantDto } from './dto/create-restaurant.dto';
import type { ReplaceOpeningHoursDto } from './dto/replace-opening-hours.dto';
import type { UpdateRestaurantAddressDto } from './dto/update-restaurant-address.dto';
import type { UpdateRestaurantDto } from './dto/update-restaurant.dto';

export class OwnerRoleNotConfiguredError extends Error {
  constructor() {
    super('OWNER role is not configured');
  }
}

export class OnboardingUserNotFoundError extends Error {
  constructor() {
    super('Onboarding user is not active');
  }
}

export class CannotUnsetPrimaryAddressError extends Error {}
export class CannotDeleteLastAddressError extends Error {}

const addressSelect = {
  id: true,
  label: true,
  street: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  latitude: true,
  longitude: true,
  isPrimary: true,
  createdAt: true,
  updatedAt: true,
} as const;

const managementSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  email: true,
  phone: true,
  currency: true,
  timezone: true,
  isActive: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  addresses: {
    orderBy: { isPrimary: 'desc' as const },
    select: addressSelect,
  },
  openingHours: {
    orderBy: { day: 'asc' as const },
    select: {
      id: true,
      day: true,
      opensAt: true,
      closesAt: true,
      isClosed: true,
    },
  },
  settings: {
    select: {
      acceptsOrders: true,
      acceptsReservations: true,
      autoAcceptOrders: true,
      estimatedPrepMinutes: true,
      minimumOrder: true,
      deliveryFee: true,
      serviceFee: true,
      taxRate: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  media: {
    select: {
      type: true,
      alt: true,
      media: {
        select: {
          url: true,
          publicId: true,
          fileName: true,
          mimeType: true,
          width: true,
          height: true,
          size: true,
          createdAt: true,
        },
      },
    },
  },
} as const;

const restaurantSummarySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  currency: true,
  timezone: true,
  isActive: true,
  status: true,
  addresses: {
    where: { isPrimary: true },
    take: 1,
    select: addressSelect,
  },
  media: {
    where: { type: RestaurantMediaType.LOGO },
    take: 1,
    select: {
      type: true,
      alt: true,
      media: {
        select: {
          url: true,
          width: true,
          height: true,
        },
      },
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class RestaurantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createForOwner(userId: string, slug: string, data: CreateRestaurantDto) {
    return this.prisma.$transaction(async (transaction) => {
      const [ownerRole, user] = await Promise.all([
        transaction.role.findUnique({
          where: { name: 'OWNER' },
          select: { id: true },
        }),
        transaction.user.findFirst({
          where: { id: userId, isActive: true, deletedAt: null },
          select: { id: true },
        }),
      ]);

      if (!ownerRole) {
        throw new OwnerRoleNotConfiguredError();
      }
      if (!user) {
        throw new OnboardingUserNotFoundError();
      }

      const restaurant = await transaction.restaurant.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          email: data.email,
          phone: data.phone,
          currency: data.currency ?? 'EUR',
          timezone: data.timezone ?? 'Europe/Helsinki',
          settings: { create: {} },
          addresses: {
            create: {
              ...data.primaryAddress,
              isPrimary: true,
            },
          },
          members: {
            create: { userId, roleId: ownerRole.id },
          },
          ...(data.openingHours?.length
            ? {
                openingHours: {
                  create: data.openingHours.map((hours) => ({
                    day: hours.day,
                    isClosed: hours.isClosed,
                    opensAt: hours.isClosed ? null : hours.opensAt,
                    closesAt: hours.isClosed ? null : hours.closesAt,
                  })),
                },
              }
            : {}),
        },
        select: managementSelect,
      });

      return {
        ...restaurant,
        callerRole: 'OWNER' as const,
        callerPermissions: restaurantPermissionsForRole('OWNER'),
      };
    });
  }

  findMembershipsByUserId(userId: string) {
    return this.prisma.restaurantMember.findMany({
      where: {
        userId,
        restaurant: { isActive: true, deletedAt: null },
      },
      orderBy: { joinedAt: 'desc' },
      select: {
        joinedAt: true,
        role: { select: { name: true } },
        restaurant: { select: restaurantSummarySelect },
      },
    });
  }

  findManagementById(restaurantId: string) {
    return this.prisma.restaurant.findFirst({
      where: { id: restaurantId, isActive: true, deletedAt: null },
      select: managementSelect,
    });
  }

  updateById(restaurantId: string, data: UpdateRestaurantDto) {
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.restaurant.updateMany({
        where: { id: restaurantId, isActive: true, deletedAt: null },
        data,
      });
      if (updated.count !== 1) {
        return null;
      }
      return transaction.restaurant.findUnique({
        where: { id: restaurantId },
        select: managementSelect,
      });
    });
  }

  replaceOpeningHours(restaurantId: string, data: ReplaceOpeningHoursDto) {
    return this.prisma.$transaction(async (transaction) => {
      const restaurant = await transaction.restaurant.findFirst({
        where: { id: restaurantId, isActive: true, deletedAt: null },
        select: { id: true },
      });
      if (!restaurant) {
        return null;
      }

      await transaction.openingHour.deleteMany({ where: { restaurantId } });
      if (data.openingHours.length) {
        await transaction.openingHour.createMany({
          data: data.openingHours.map((hours) => ({
            restaurantId,
            day: hours.day,
            isClosed: hours.isClosed,
            opensAt: hours.isClosed ? null : hours.opensAt,
            closesAt: hours.isClosed ? null : hours.closesAt,
          })),
        });
      }

      return transaction.openingHour.findMany({
        where: { restaurantId },
        orderBy: { day: 'asc' },
        select: managementSelect.openingHours.select,
      });
    });
  }

  listAddresses(restaurantId: string) {
    return this.prisma.restaurantAddress.findMany({
      where: {
        restaurantId,
        restaurant: { isActive: true, deletedAt: null },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      select: addressSelect,
    });
  }

  addAddress(restaurantId: string, data: AddRestaurantAddressDto) {
    return this.prisma.$transaction(
      async (transaction) => {
        const restaurant = await transaction.restaurant.findFirst({
          where: { id: restaurantId, isActive: true, deletedAt: null },
          select: { _count: { select: { addresses: true } } },
        });
        if (!restaurant) {
          return null;
        }

        const isPrimary =
          data.isPrimary === true || restaurant._count.addresses === 0;
        if (isPrimary) {
          await transaction.restaurantAddress.updateMany({
            where: { restaurantId, isPrimary: true },
            data: { isPrimary: false },
          });
        }

        return transaction.restaurantAddress.create({
          data: { ...data, restaurantId, isPrimary },
          select: addressSelect,
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  updateAddress(
    restaurantId: string,
    addressId: string,
    data: UpdateRestaurantAddressDto,
  ) {
    return this.prisma.$transaction(
      async (transaction) => {
        const address = await transaction.restaurantAddress.findFirst({
          where: {
            id: addressId,
            restaurantId,
            restaurant: { isActive: true, deletedAt: null },
          },
          select: { id: true, isPrimary: true },
        });
        if (!address) {
          return null;
        }
        if (address.isPrimary && data.isPrimary === false) {
          throw new CannotUnsetPrimaryAddressError();
        }
        if (data.isPrimary === true && !address.isPrimary) {
          await transaction.restaurantAddress.updateMany({
            where: { restaurantId, isPrimary: true },
            data: { isPrimary: false },
          });
        }

        return transaction.restaurantAddress.update({
          where: { id: addressId },
          data,
          select: addressSelect,
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  deleteAddress(restaurantId: string, addressId: string) {
    return this.prisma.$transaction(
      async (transaction) => {
        const [address, count] = await Promise.all([
          transaction.restaurantAddress.findFirst({
            where: {
              id: addressId,
              restaurantId,
              restaurant: { isActive: true, deletedAt: null },
            },
            select: { id: true, isPrimary: true },
          }),
          transaction.restaurantAddress.count({ where: { restaurantId } }),
        ]);
        if (!address) {
          return false;
        }
        if (count <= 1) {
          throw new CannotDeleteLastAddressError();
        }

        await transaction.restaurantAddress.delete({
          where: { id: addressId },
        });
        if (address.isPrimary) {
          const replacement = await transaction.restaurantAddress.findFirst({
            where: { restaurantId },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          });
          if (replacement) {
            await transaction.restaurantAddress.update({
              where: { id: replacement.id },
              data: { isPrimary: true },
            });
          }
        }
        return true;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  replaceMedia(
    restaurantId: string,
    type: RestaurantMediaType,
    upload: UploadResult,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const restaurant = await transaction.restaurant.findFirst({
        where: { id: restaurantId, isActive: true, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!restaurant) {
        return null;
      }

      const previous = await transaction.restaurantMedia.findUnique({
        where: { restaurantId_type: { restaurantId, type } },
        select: { mediaId: true, media: { select: { publicId: true } } },
      });
      if (previous) {
        await transaction.restaurantMedia.delete({
          where: {
            restaurantId_mediaId: {
              restaurantId,
              mediaId: previous.mediaId,
            },
          },
        });
        await transaction.media.delete({ where: { id: previous.mediaId } });
      }

      const media = await transaction.media.create({
        data: {
          ...upload,
          restaurants: {
            create: {
              restaurantId,
              type,
              alt: `${restaurant.name} ${type.toLowerCase()}`,
            },
          },
        },
        select: {
          url: true,
          publicId: true,
          fileName: true,
          mimeType: true,
          width: true,
          height: true,
          size: true,
          createdAt: true,
        },
      });

      return {
        media,
        type,
        previousPublicId: previous?.media.publicId ?? null,
      };
    });
  }

  removeMedia(restaurantId: string, type: RestaurantMediaType) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.restaurantMedia.findFirst({
        where: {
          restaurantId,
          type,
          restaurant: { isActive: true, deletedAt: null },
        },
        select: { mediaId: true, media: { select: { publicId: true } } },
      });
      if (!existing) {
        return null;
      }

      await transaction.restaurantMedia.delete({
        where: {
          restaurantId_mediaId: {
            restaurantId,
            mediaId: existing.mediaId,
          },
        },
      });
      await transaction.media.delete({ where: { id: existing.mediaId } });
      return existing.media.publicId;
    });
  }
}
