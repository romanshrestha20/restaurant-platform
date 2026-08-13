import { Injectable } from '@nestjs/common';
import type { Prisma } from '@restaurant/database/generated';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateMenuCategoryDto,
  CreateMenuDto,
  CreateMenuItemDto,
  MenuCategoryListQueryDto,
  MenuItemListQueryDto,
  MenuListQueryDto,
  UpdateMenuCategoryDto,
  UpdateMenuDto,
  UpdateMenuItemDto,
} from './dto/menu.dto';

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

  createMenu(restaurantId: string, data: CreateMenuDto) {
    return this.prisma.menu.create({
      data: { restaurantId, ...data },
      select: menuSelect,
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
}
