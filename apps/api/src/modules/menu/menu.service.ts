import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createPaginationMeta } from '../../common/pagination';
import {
  RealtimeGateway,
  type MenuItemEventData,
  type ServerToClientEvents,
} from '../../common/realtime';
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
import { MenuRepository } from './menu.repository';

const isUniqueConflict = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002';

const serializeMoney = (value: unknown) =>
  typeof value === 'object' &&
  value !== null &&
  'toFixed' in value &&
  typeof value.toFixed === 'function'
    ? value.toFixed(2)
    : Number(value).toFixed(2);

const serializeMenuItem = <T extends { basePrice: unknown }>(item: T) => ({
  ...item,
  basePrice: serializeMoney(item.basePrice),
});

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    private readonly repository: MenuRepository,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async listMenus(restaurantId: string, query: MenuListQueryDto) {
    const { data, total } = await this.repository.listMenus(
      restaurantId,
      query,
    );
    return {
      data,
      pagination: createPaginationMeta(query.page, query.limit, total),
    };
  }

  async createMenu(restaurantId: string, data: CreateMenuDto) {
    try {
      return await this.repository.createMenu(restaurantId, data);
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'A menu with this name already exists in the restaurant',
        );
      }
      throw error;
    }
  }

  async getMenu(restaurantId: string, menuId: string) {
    const menu = await this.repository.getMenu(restaurantId, menuId);
    if (!menu) throw new NotFoundException('Menu not found');
    return {
      ...menu,
      categories: menu.categories.map((category) => ({
        ...category,
        menuItems: category.menuItems.map(serializeMenuItem),
      })),
    };
  }

  async updateMenu(restaurantId: string, menuId: string, data: UpdateMenuDto) {
    this.requireChanges(data);
    try {
      const menu = await this.repository.updateMenu(restaurantId, menuId, data);
      if (!menu) throw new NotFoundException('Menu not found');
      return menu;
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'A menu with this name already exists in the restaurant',
        );
      }
      throw error;
    }
  }

  async deleteMenu(restaurantId: string, menuId: string): Promise<void> {
    if (!(await this.repository.deleteMenu(restaurantId, menuId))) {
      throw new NotFoundException('Menu not found');
    }
  }

  async listCategories(restaurantId: string, query: MenuCategoryListQueryDto) {
    const { data, total } = await this.repository.listCategories(
      restaurantId,
      query,
    );
    return {
      data,
      pagination: createPaginationMeta(query.page, query.limit, total),
    };
  }

  async createCategory(restaurantId: string, data: CreateMenuCategoryDto) {
    try {
      const category = await this.repository.createCategory(restaurantId, data);
      if (!category) throw new NotFoundException('Menu not found');
      return category;
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'A category with this name already exists in the menu',
        );
      }
      throw error;
    }
  }

  async updateCategory(
    restaurantId: string,
    categoryId: string,
    data: UpdateMenuCategoryDto,
  ) {
    this.requireChanges(data);
    try {
      const category = await this.repository.updateCategory(
        restaurantId,
        categoryId,
        data,
      );
      if (!category) throw new NotFoundException('Menu category not found');
      return category;
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'A category with this name already exists in the menu',
        );
      }
      throw error;
    }
  }

  async deleteCategory(
    restaurantId: string,
    categoryId: string,
  ): Promise<void> {
    if (!(await this.repository.deleteCategory(restaurantId, categoryId))) {
      throw new NotFoundException('Menu category not found');
    }
  }

  async listItems(restaurantId: string, query: MenuItemListQueryDto) {
    const { data, total } = await this.repository.listItems(
      restaurantId,
      query,
    );
    return {
      data: data.map(serializeMenuItem),
      pagination: createPaginationMeta(query.page, query.limit, total),
    };
  }

  async createItem(restaurantId: string, data: CreateMenuItemDto) {
    try {
      const item = await this.repository.createItem(restaurantId, data);
      if (!item) throw new NotFoundException('Menu category not found');
      this.emitToRestaurant(
        restaurantId,
        'menu:item_created',
        this.itemEvent('menu:item_created', restaurantId, item),
      );
      return serializeMenuItem(item);
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'A menu item with this SKU already exists in the restaurant',
        );
      }
      throw error;
    }
  }

  async updateItem(
    restaurantId: string,
    itemId: string,
    data: UpdateMenuItemDto,
  ) {
    this.requireChanges(data);
    try {
      const item = await this.repository.updateItem(restaurantId, itemId, data);
      if (!item) throw new NotFoundException('Menu item or category not found');
      this.emitToRestaurant(
        restaurantId,
        'menu:item_updated',
        this.itemEvent('menu:item_updated', restaurantId, item),
      );
      return serializeMenuItem(item);
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ConflictException(
          'A menu item with this SKU already exists in the restaurant',
        );
      }
      throw error;
    }
  }

  async deleteItem(restaurantId: string, itemId: string): Promise<void> {
    if (!(await this.repository.deleteItem(restaurantId, itemId))) {
      throw new NotFoundException('Menu item not found');
    }
    this.emitToRestaurant(restaurantId, 'menu:item_deleted', {
      event: 'menu:item_deleted',
      restaurantId,
      occurredAt: new Date().toISOString(),
      data: { itemId },
    });
  }

  private requireChanges(data: object): void {
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one field is required');
    }
  }

  private itemEvent<Event extends 'menu:item_created' | 'menu:item_updated'>(
    event: Event,
    restaurantId: string,
    item: {
      id: string;
      categoryId: string;
      name: string;
      description: string | null;
      basePrice: unknown;
      sortOrder: number;
      status: MenuItemEventData['status'];
    },
  ) {
    return {
      event,
      restaurantId,
      occurredAt: new Date().toISOString(),
      data: {
        item: {
          id: item.id,
          categoryId: item.categoryId,
          name: item.name,
          description: item.description,
          price: serializeMoney(item.basePrice),
          sortOrder: item.sortOrder,
          status: item.status,
        },
      },
    };
  }

  private emitToRestaurant<
    Event extends
      'menu:item_created' | 'menu:item_updated' | 'menu:item_deleted',
  >(
    restaurantId: string,
    event: Event,
    ...args: Parameters<ServerToClientEvents[Event]>
  ): void {
    try {
      this.realtimeGateway.emitToRestaurant(restaurantId, event, ...args);
    } catch (error) {
      this.logger.warn(
        `Menu change persisted but ${event} delivery failed for ${restaurantId}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
