import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const money = (value: { toFixed(digits: number): string } | number) =>
  value.toFixed(2);

const distanceKm = (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(toLat - fromLat);
  const dLng = radians(toLng - fromLng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(fromLat)) * Math.cos(radians(toLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listRestaurants(customerLatitude?: number, customerLongitude?: number) {
    const hasCustomerLocation = Number.isFinite(customerLatitude) && Number.isFinite(customerLongitude);
    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        deletedAt: null,
        settings: { acceptsOrders: true },
        menus: { some: { isActive: true, deletedAt: null, categories: { some: { status: 'ACTIVE', deletedAt: null, menuItems: { some: { status: 'AVAILABLE', deletedAt: null } } } } } },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        currency: true,
        settings: { select: { estimatedPrepMinutes: true, deliveryRadiusKm: true, deliveryFee: true, minimumOrder: true } },
        media: { where: { type: { in: ['COVER', 'LOGO'] } }, select: { type: true, alt: true, media: { select: { url: true } } } },
        addresses: { where: { isPrimary: true }, take: 1, select: { city: true, country: true, latitude: true, longitude: true } },
        _count: { select: { menuItems: true } },
      },
    });

    return restaurants.flatMap((restaurant) => {
      const address = restaurant.addresses[0];
      const hasCoordinates = address?.latitude != null && address.longitude != null;
      const distance = hasCustomerLocation && hasCoordinates
        ? distanceKm(customerLatitude!, customerLongitude!, Number(address.latitude), Number(address.longitude))
        : null;
      const deliveryRadiusKm = restaurant.settings ? Number(restaurant.settings.deliveryRadiusKm) : 5;
      if (hasCustomerLocation && (distance === null || distance > deliveryRadiusKm)) return [];
      return [{
        ...restaurant,
        addresses: restaurant.addresses.map(({ latitude, longitude, ...place }) => place),
        distanceKm: distance === null ? null : Number(distance.toFixed(1)),
        deliveryRadiusKm,
        deliveryFee: restaurant.settings ? Number(restaurant.settings.deliveryFee) : 0,
        minimumOrder: restaurant.settings ? Number(restaurant.settings.minimumOrder) : 0,
        deliveryAvailable: distance !== null && distance <= deliveryRadiusKm,
        itemCount: restaurant._count.menuItems,
        _count: undefined,
      }];
    });
  }

  async getRestaurantCatalog(slug: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        slug,
        isActive: true,
        status: 'ACTIVE',
        deletedAt: null,
        settings: { acceptsOrders: true },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        currency: true,
        timezone: true,
        settings: {
          select: {
            estimatedPrepMinutes: true,
            minimumOrder: true,
            deliveryFee: true,
            serviceFee: true,
            taxRate: true,
          },
        },
        media: {
          select: {
            type: true,
            alt: true,
            media: { select: { url: true, width: true, height: true } },
          },
        },
        menus: {
          where: { isActive: true, deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            name: true,
            description: true,
            categories: {
              where: { status: 'ACTIVE', deletedAt: null },
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
              select: {
                id: true,
                name: true,
                description: true,
                menuItems: {
                  where: { status: 'AVAILABLE', deletedAt: null },
                  orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    basePrice: true,
                    preparationTime: true,
                    calories: true,
                    isFeatured: true,
                    media: {
                      orderBy: { sortOrder: 'asc' },
                      select: {
                        alt: true,
                        media: { select: { url: true, width: true, height: true } },
                      },
                    },
                    variants: {
                      orderBy: { sortOrder: 'asc' },
                      select: {
                        id: true,
                        name: true,
                        options: {
                          orderBy: { name: 'asc' },
                          select: { id: true, name: true, priceAdjustment: true },
                        },
                      },
                    },
                    addOnGroups: {
                      select: {
                        group: {
                          select: {
                            id: true,
                            name: true,
                            required: true,
                            minSelection: true,
                            maxSelection: true,
                            addOns: {
                              where: { isAvailable: true },
                              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                              select: { id: true, name: true, price: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!restaurant) throw new NotFoundException('Restaurant is not accepting orders');

    return {
      ...restaurant,
      settings: restaurant.settings
        ? {
            ...restaurant.settings,
            minimumOrder: money(restaurant.settings.minimumOrder),
            deliveryFee: money(restaurant.settings.deliveryFee),
            serviceFee: money(restaurant.settings.serviceFee),
            taxRate: money(restaurant.settings.taxRate),
          }
        : null,
      menus: restaurant.menus.map((menu) => ({
        ...menu,
        categories: menu.categories.map((category) => ({
          ...category,
          items: category.menuItems.map((item) => ({
            ...item,
            basePrice: money(item.basePrice),
            variants: item.variants.map((variant) => ({
              ...variant,
              options: variant.options.map((option) => ({
                ...option,
                priceAdjustment: money(option.priceAdjustment),
              })),
            })),
            addOnGroups: item.addOnGroups.map(({ group }) => ({
              ...group,
              addOns: group.addOns.map((addOn) => ({
                ...addOn,
                price: money(addOn.price),
              })),
            })),
          })),
          menuItems: undefined,
        })),
      })),
    };
  }
}
