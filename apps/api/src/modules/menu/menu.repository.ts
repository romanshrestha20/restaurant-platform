import { Injectable } from '@nestjs/common';
import type { Prisma } from '@restaurant/database/generated';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateAddOnDto,
  CreateAddOnGroupDto,
  CreateMenuCategoryDto,
  CreateMenuDto,
  CreateMenuItemDto,
  ImportMenuCsvRowDto,
  CreateVariantDto,
  CreateVariantOptionDto,
  MenuCategoryListQueryDto,
  MenuItemListQueryDto,
  MenuListQueryDto,
  UpdateMenuCategoryDto,
  UpdateMenuDto,
  UpdateMenuItemDto,
  UpdateAddOnDto,
  UpdateAddOnGroupDto,
  UpdateVariantDto,
  UpdateVariantOptionDto,
} from './dto/menu.dto';
import type { UploadResult } from '../../common/upload/types/upload-result.type';

const itemSelect = {
  id: true,
  restaurantId: true,
  categoryId: true,
  name: true,
  description: true,
  sku: true,
  basePrice: true,
  preparationTime: true,
  calories: true,
  isFeatured: true,
  sortOrder: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  media: {
    take: 1,
    orderBy: { sortOrder: 'asc' as const },
    select: {
      alt: true,
      media: { select: { url: true, width: true, height: true } },
    },
  },
} as const;

const configurationSelect = {
  ...itemSelect,
  media: {
    orderBy: { sortOrder: 'asc' as const },
    select: {
      mediaId: true,
      alt: true,
      sortOrder: true,
      media: {
        select: {
          id: true,
          url: true,
          width: true,
          height: true,
          fileName: true,
        },
      },
    },
  },
  variants: {
    orderBy: { sortOrder: 'asc' as const },
    select: {
      id: true,
      name: true,
      sortOrder: true,
      options: {
        orderBy: { name: 'asc' as const },
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
            orderBy: { sortOrder: 'asc' as const },
            select: {
              id: true,
              name: true,
              price: true,
              sortOrder: true,
              isAvailable: true,
            },
          },
        },
      },
    },
  },
} as const;

const categorySelect = {
  id: true,
  restaurantId: true,
  menuId: true,
  name: true,
  description: true,
  sortOrder: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const menuSelect = {
  id: true,
  restaurantId: true,
  name: true,
  description: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { categories: { where: { deletedAt: null } } } },
} as const;

const direction = (order: 'asc' | 'desc') => order;

@Injectable()
export class MenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listMenus(restaurantId: string, query: MenuListQueryDto) {
    const where: Prisma.MenuWhereInput = {
      restaurantId,
      deletedAt: null,
      restaurant: { isActive: true, deletedAt: null },
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.menu.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: query.sort
          ? [{ [query.sort]: direction(query.order) }]
          : [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: menuSelect,
      }),
      this.prisma.menu.count({ where }),
    ]);
    return { data, total };
  }

  async createMenu(restaurantId: string, data: CreateMenuDto) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!restaurant) return null;
    return this.prisma.menu.create({
      data: { restaurantId, ...data },
      select: menuSelect,
    });
  }

  ensureDefaultMenu(restaurantId: string) {
    return this.prisma.menu.upsert({
      where: {
        restaurantId_name: { restaurantId, name: 'Main menu' },
      },
      update: { deletedAt: null },
      create: {
        restaurantId,
        name: 'Main menu',
        description: 'Draft menu created during restaurant setup',
        isActive: false,
      },
      select: menuSelect,
    });
  }

  importCsv(restaurantId: string, menuId: string, rows: ImportMenuCsvRowDto[]) {
    return this.prisma.$transaction(async (transaction) => {
      const menu = await transaction.menu.findFirst({
        where: {
          id: menuId,
          restaurantId,
          deletedAt: null,
          restaurant: { isActive: true, deletedAt: null },
        },
        select: { id: true },
      });
      if (!menu) return null;

      const existingCategories = await transaction.category.findMany({
        where: { menuId, restaurantId, deletedAt: null },
        select: { id: true, name: true },
      });
      const categoryIds = new Map(
        existingCategories.map((category) => [
          category.name.trim().toLocaleLowerCase(),
          category.id,
        ]),
      );
      let categoriesCreated = 0;

      for (const row of rows) {
        const key = row.category.trim().toLocaleLowerCase();
        if (categoryIds.has(key)) continue;
        const category = await transaction.category.create({
          data: {
            restaurantId,
            menuId,
            name: row.category.trim(),
            sortOrder: categoryIds.size,
          },
          select: { id: true },
        });
        categoryIds.set(key, category.id);
        categoriesCreated += 1;
      }

      await transaction.menuItem.createMany({
        data: rows.map((row, index) => ({
          restaurantId,
          categoryId: categoryIds.get(row.category.trim().toLocaleLowerCase())!,
          name: row.name,
          description: row.description || null,
          sku: row.sku || null,
          basePrice: row.price,
          preparationTime: row.preparationTime ?? null,
          calories: row.calories ?? null,
          isFeatured: row.isFeatured ?? false,
          status: row.status,
          sortOrder: index,
        })),
      });

      return {
        menuId,
        categoriesCreated,
        itemsCreated: rows.length,
      };
    });
  }

  getMenu(restaurantId: string, menuId: string) {
    return this.prisma.menu.findFirst({
      where: {
        id: menuId,
        restaurantId,
        deletedAt: null,
        restaurant: { isActive: true, deletedAt: null },
      },
      select: {
        ...menuSelect,
        categories: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: {
            ...categorySelect,
            menuItems: {
              where: { deletedAt: null },
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
              select: itemSelect,
            },
          },
        },
      },
    });
  }

  async updateMenu(restaurantId: string, menuId: string, data: UpdateMenuDto) {
    const updated = await this.prisma.menu.updateMany({
      where: { id: menuId, restaurantId, deletedAt: null },
      data,
    });
    return updated.count === 1 ? this.getMenu(restaurantId, menuId) : null;
  }

  async deleteMenu(restaurantId: string, menuId: string) {
    const deleted = await this.prisma.menu.updateMany({
      where: { id: menuId, restaurantId, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });
    return deleted.count === 1;
  }

  async listCategories(restaurantId: string, query: MenuCategoryListQueryDto) {
    const where: Prisma.CategoryWhereInput = {
      restaurantId,
      deletedAt: null,
      menu: { deletedAt: null },
      ...(query.menuId ? { menuId: query.menuId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: query.sort
          ? [{ [query.sort]: direction(query.order) }]
          : [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          ...categorySelect,
          _count: { select: { menuItems: { where: { deletedAt: null } } } },
        },
      }),
      this.prisma.category.count({ where }),
    ]);
    return { data, total };
  }

  async createCategory(restaurantId: string, data: CreateMenuCategoryDto) {
    const menu = await this.prisma.menu.findFirst({
      where: { id: data.menuId, restaurantId, deletedAt: null },
      select: { id: true },
    });
    if (!menu) return null;
    return this.prisma.category.create({
      data: { restaurantId, ...data },
      select: categorySelect,
    });
  }

  async updateCategory(
    restaurantId: string,
    categoryId: string,
    data: UpdateMenuCategoryDto,
  ) {
    const updated = await this.prisma.category.updateMany({
      where: {
        id: categoryId,
        restaurantId,
        deletedAt: null,
        menu: { deletedAt: null },
      },
      data,
    });
    return updated.count === 1
      ? this.prisma.category.findUnique({
          where: { id: categoryId },
          select: categorySelect,
        })
      : null;
  }

  async deleteCategory(restaurantId: string, categoryId: string) {
    const deleted = await this.prisma.category.updateMany({
      where: { id: categoryId, restaurantId, deletedAt: null },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
    return deleted.count === 1;
  }

  async listItems(restaurantId: string, query: MenuItemListQueryDto) {
    const where: Prisma.MenuItemWhereInput = {
      restaurantId,
      deletedAt: null,
      category: {
        deletedAt: null,
        menu: { deletedAt: null },
        ...(query.menuId ? { menuId: query.menuId } : {}),
      },
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.menuItem.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: query.sort
          ? [
              {
                [query.sort === 'price' ? 'basePrice' : query.sort]: direction(
                  query.order,
                ),
              },
            ]
          : [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: itemSelect,
      }),
      this.prisma.menuItem.count({ where }),
    ]);
    return { data, total };
  }

  async createItem(restaurantId: string, data: CreateMenuItemDto) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: data.categoryId,
        restaurantId,
        deletedAt: null,
        menu: { deletedAt: null },
      },
      select: { id: true },
    });
    if (!category) return null;
    const { price, ...item } = data;
    return this.prisma.menuItem.create({
      data: { restaurantId, ...item, basePrice: price },
      select: itemSelect,
    });
  }

  async updateItem(
    restaurantId: string,
    itemId: string,
    data: UpdateMenuItemDto,
  ) {
    if (data.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: data.categoryId,
          restaurantId,
          deletedAt: null,
          menu: { deletedAt: null },
        },
        select: { id: true },
      });
      if (!category) return null;
    }
    const { price, ...item } = data;
    const updated = await this.prisma.menuItem.updateMany({
      where: {
        id: itemId,
        restaurantId,
        deletedAt: null,
        category: { deletedAt: null, menu: { deletedAt: null } },
      },
      data: { ...item, ...(price !== undefined ? { basePrice: price } : {}) },
    });
    return updated.count === 1
      ? this.prisma.menuItem.findUnique({
          where: { id: itemId },
          select: itemSelect,
        })
      : null;
  }

  async deleteItem(restaurantId: string, itemId: string) {
    const deleted = await this.prisma.menuItem.updateMany({
      where: { id: itemId, restaurantId, deletedAt: null },
      data: { deletedAt: new Date(), status: 'HIDDEN' },
    });
    return deleted.count === 1;
  }

  getItemConfiguration(restaurantId: string, itemId: string) {
    return this.prisma.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId,
        deletedAt: null,
        category: { deletedAt: null, menu: { deletedAt: null } },
      },
      select: configurationSelect,
    });
  }

  addItemMedia(
    restaurantId: string,
    itemId: string,
    uploaded: UploadResult,
    alt?: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const item = await transaction.menuItem.findFirst({
        where: { id: itemId, restaurantId, deletedAt: null },
        select: { id: true, _count: { select: { media: true } } },
      });
      if (!item) return null;
      return transaction.media.create({
        data: {
          ...uploaded,
          menuItems: {
            create: {
              menuItemId: itemId,
              alt: alt?.trim() || null,
              sortOrder: item._count.media,
            },
          },
        },
        select: {
          id: true,
          url: true,
          width: true,
          height: true,
          fileName: true,
        },
      });
    });
  }

  removeItemMedia(restaurantId: string, itemId: string, mediaId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const link = await transaction.menuItemMedia.findFirst({
        where: { menuItemId: itemId, mediaId, menuItem: { restaurantId } },
        select: { media: { select: { publicId: true } } },
      });
      if (!link) return null;
      await transaction.media.delete({ where: { id: mediaId } });
      return link.media.publicId;
    });
  }

  async createVariant(
    restaurantId: string,
    itemId: string,
    data: CreateVariantDto,
  ) {
    const item = await this.prisma.menuItem.findFirst({
      where: {
        id: itemId,
        restaurantId,
        deletedAt: null,
        category: { deletedAt: null, menu: { deletedAt: null, restaurant: { isActive: true, deletedAt: null } } },
      },
      select: { id: true },
    });
    return item
      ? this.prisma.variant.create({ data: { menuItemId: itemId, ...data } })
      : null;
  }

  async updateVariant(
    restaurantId: string,
    variantId: string,
    data: UpdateVariantDto,
  ) {
    const variant = await this.prisma.variant.findFirst({
      where: {
        id: variantId,
        menuItem: {
          restaurantId,
          deletedAt: null,
          category: { deletedAt: null, menu: { deletedAt: null } },
        },
      },
      select: { id: true },
    });
    if (!variant) return null;
    return this.prisma.variant.update({
      where: { id: variantId },
      data,
    });
  }

  async deleteVariant(restaurantId: string, variantId: string) {
    const variant = await this.prisma.variant.findFirst({
      where: {
        id: variantId,
        menuItem: {
          restaurantId,
          deletedAt: null,
          category: { deletedAt: null, menu: { deletedAt: null } },
        },
      },
      select: { id: true },
    });
    if (!variant) return false;
    await this.prisma.variant.delete({ where: { id: variantId } });
    return true;
  }

  async createVariantOption(
    restaurantId: string,
    variantId: string,
    data: CreateVariantOptionDto,
  ) {
    const variant = await this.prisma.variant.findFirst({
      where: {
        id: variantId,
        menuItem: {
          restaurantId,
          deletedAt: null,
          category: { deletedAt: null, menu: { deletedAt: null } },
        },
      },
      select: { id: true },
    });
    return variant
      ? this.prisma.variantOption.create({ data: { variantId, ...data } })
      : null;
  }

  async updateVariantOption(
    restaurantId: string,
    optionId: string,
    data: UpdateVariantOptionDto,
  ) {
    const option = await this.prisma.variantOption.findFirst({
      where: {
        id: optionId,
        variant: {
          menuItem: {
            restaurantId,
            deletedAt: null,
            category: { deletedAt: null, menu: { deletedAt: null } },
          },
        },
      },
      select: { id: true },
    });
    if (!option) return null;
    return this.prisma.variantOption.update({
      where: { id: optionId },
      data,
    });
  }

  async deleteVariantOption(restaurantId: string, optionId: string) {
    const option = await this.prisma.variantOption.findFirst({
      where: {
        id: optionId,
        variant: {
          menuItem: {
            restaurantId,
            deletedAt: null,
            category: { deletedAt: null, menu: { deletedAt: null } },
          },
        },
      },
      select: { id: true },
    });
    if (!option) return false;
    await this.prisma.variantOption.delete({ where: { id: optionId } });
    return true;
  }

  listAddOnGroups(restaurantId: string) {
    return this.prisma.addOnGroup.findMany({
      where: { restaurantId, restaurant: { isActive: true, deletedAt: null } },
      orderBy: { name: 'asc' },
      include: { addOns: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] } },
    });
  }

  async createAddOnGroup(restaurantId: string, data: CreateAddOnGroupDto) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!restaurant) return null;
    return this.prisma.addOnGroup.create({ data: { restaurantId, ...data } });
  }

  async updateAddOnGroup(
    restaurantId: string,
    groupId: string,
    data: UpdateAddOnGroupDto,
  ) {
    const result = await this.prisma.addOnGroup.updateMany({
      where: { id: groupId, restaurantId },
      data,
    });
    return result.count
      ? this.prisma.addOnGroup.findUnique({
          where: { id: groupId },
          include: { addOns: true },
        })
      : null;
  }

  async deleteAddOnGroup(restaurantId: string, groupId: string) {
    const group = await this.prisma.addOnGroup.findFirst({
      where: { id: groupId, restaurantId },
      select: { id: true },
    });
    if (!group) return false;
    await this.prisma.addOnGroup.delete({ where: { id: groupId } });
    return true;
  }

  async createAddOn(
    restaurantId: string,
    groupId: string,
    data: CreateAddOnDto,
  ) {
    const group = await this.prisma.addOnGroup.findFirst({
      where: { id: groupId, restaurantId },
      select: { id: true },
    });
    return group
      ? this.prisma.addOn.create({ data: { groupId, ...data } })
      : null;
  }

  async updateAddOn(
    restaurantId: string,
    addOnId: string,
    data: UpdateAddOnDto,
  ) {
    const addOn = await this.prisma.addOn.findFirst({
      where: { id: addOnId, group: { restaurantId } },
      select: { id: true },
    });
    if (!addOn) return null;
    return this.prisma.addOn.update({
      where: { id: addOnId },
      data,
    });
  }

  async deleteAddOn(restaurantId: string, addOnId: string) {
    const addOn = await this.prisma.addOn.findFirst({
      where: { id: addOnId, group: { restaurantId } },
      select: { id: true },
    });
    if (!addOn) return false;
    await this.prisma.addOn.delete({ where: { id: addOnId } });
    return true;
  }

  async attachAddOnGroup(
    restaurantId: string,
    itemId: string,
    groupId: string,
  ) {
    const [item, group] = await Promise.all([
      this.prisma.menuItem.findFirst({
        where: {
          id: itemId,
          restaurantId,
          deletedAt: null,
          category: { deletedAt: null, menu: { deletedAt: null } },
        },
        select: { id: true },
      }),
      this.prisma.addOnGroup.findFirst({
        where: { id: groupId, restaurantId },
        select: { id: true },
      }),
    ]);
    if (!item || !group) return null;
    return this.prisma.menuItemAddOnGroup.upsert({
      where: { menuItemId_groupId: { menuItemId: itemId, groupId } },
      create: { menuItemId: itemId, groupId },
      update: {},
    });
  }

  async detachAddOnGroup(
    restaurantId: string,
    itemId: string,
    groupId: string,
  ) {
    const link = await this.prisma.menuItemAddOnGroup.findFirst({
      where: {
        menuItemId: itemId,
        groupId,
        menuItem: {
          restaurantId,
          deletedAt: null,
          category: { deletedAt: null, menu: { deletedAt: null } },
        },
        group: { restaurantId },
      },
      select: { menuItemId: true, groupId: true },
    });
    if (!link) return false;
    await this.prisma.menuItemAddOnGroup.delete({
      where: { menuItemId_groupId: { menuItemId: itemId, groupId } },
    });
    return true;
  }
}
