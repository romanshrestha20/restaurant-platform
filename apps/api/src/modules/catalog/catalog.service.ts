import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const money = (value: { toFixed(digits: number): string } | number) =>
  value.toFixed(2);

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

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
