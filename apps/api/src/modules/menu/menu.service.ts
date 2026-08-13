import {
  BadRequestException,
  ConflictException,
  BadGatewayException,
  HttpException,
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
  CreateAddOnDto,
  CreateAddOnGroupDto,
  CreateMenuCategoryDto,
  CreateMenuDto,
  CreateMenuItemDto,
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
import { MenuRepository } from './menu.repository';
import { UploadService } from '../../common/upload/upload.service';

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
    private readonly uploadService: UploadService,
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

  async getItemConfiguration(restaurantId: string, itemId: string) {
    const item = await this.repository.getItemConfiguration(
      restaurantId,
      itemId,
    );
    if (!item) throw new NotFoundException('Menu item not found');
    return {
      ...serializeMenuItem(item),
      variants: item.variants.map((variant) => ({
        ...variant,
        options: variant.options.map((option) => ({
          ...option,
          priceAdjustment: serializeMoney(option.priceAdjustment),
        })),
      })),
      addOnGroups: item.addOnGroups.map(({ group }) => ({
        ...group,
        addOns: group.addOns.map((addOn) => ({
          ...addOn,
          price: serializeMoney(addOn.price),
        })),
      })),
    };
  }

  async uploadItemMedia(
    restaurantId: string,
    itemId: string,
    file: Express.Multer.File,
    alt?: string,
  ) {
    let uploaded;
    try {
      uploaded = await this.uploadService.uploadImage(file, {
        folder: `restaurants/${restaurantId}/menu-items/${itemId}`,
        width: 1200,
        height: 900,
        crop: 'fill',
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Menu item media upload failed for ${itemId}`);
      throw new BadGatewayException('Menu item image upload failed');
    }
    try {
      const media = await this.repository.addItemMedia(
        restaurantId,
        itemId,
        uploaded,
        alt,
      );
      if (!media) {
        await this.uploadService.deleteQuietly(uploaded.publicId);
        throw new NotFoundException('Menu item not found');
      }
      return media;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        await this.uploadService.deleteQuietly(uploaded.publicId);
      }
      throw error;
    }
  }

  async removeItemMedia(restaurantId: string, itemId: string, mediaId: string) {
    const publicId = await this.repository.removeItemMedia(
      restaurantId,
      itemId,
      mediaId,
    );
    if (!publicId) throw new NotFoundException('Menu item image not found');
    await this.uploadService.deleteQuietly(publicId);
  }

  async createVariant(
    restaurantId: string,
    itemId: string,
    data: CreateVariantDto,
  ) {
    const variant = await this.repository.createVariant(
      restaurantId,
      itemId,
      data,
    );
    if (!variant) throw new NotFoundException('Menu item not found');
    return variant;
  }

  async updateVariant(
    restaurantId: string,
    variantId: string,
    data: UpdateVariantDto,
  ) {
    this.requireChanges(data);
    const variant = await this.repository.updateVariant(
      restaurantId,
      variantId,
      data,
    );
    if (!variant) throw new NotFoundException('Variant not found');
    return variant;
  }

  async deleteVariant(restaurantId: string, variantId: string) {
    if (!(await this.repository.deleteVariant(restaurantId, variantId))) {
      throw new NotFoundException('Variant not found');
    }
  }

  async createVariantOption(
    restaurantId: string,
    variantId: string,
    data: CreateVariantOptionDto,
  ) {
    const option = await this.repository.createVariantOption(
      restaurantId,
      variantId,
      data,
    );
    if (!option) throw new NotFoundException('Variant not found');
    return {
      ...option,
      priceAdjustment: serializeMoney(option.priceAdjustment),
    };
  }

  async updateVariantOption(
    restaurantId: string,
    optionId: string,
    data: UpdateVariantOptionDto,
  ) {
    this.requireChanges(data);
    const option = await this.repository.updateVariantOption(
      restaurantId,
      optionId,
      data,
    );
    if (!option) throw new NotFoundException('Variant option not found');
    return {
      ...option,
      priceAdjustment: serializeMoney(option.priceAdjustment),
    };
  }

  async deleteVariantOption(restaurantId: string, optionId: string) {
    if (!(await this.repository.deleteVariantOption(restaurantId, optionId))) {
      throw new NotFoundException('Variant option not found');
    }
  }

  async listAddOnGroups(restaurantId: string) {
    const groups = await this.repository.listAddOnGroups(restaurantId);
    return groups.map((group) => ({
      ...group,
      addOns: group.addOns.map((addOn) => ({
        ...addOn,
        price: serializeMoney(addOn.price),
      })),
    }));
  }

  async createAddOnGroup(restaurantId: string, data: CreateAddOnGroupDto) {
    this.validateSelectionLimits(data);
    return this.repository.createAddOnGroup(restaurantId, data);
  }

  async updateAddOnGroup(
    restaurantId: string,
    groupId: string,
    data: UpdateAddOnGroupDto,
  ) {
    this.requireChanges(data);
    this.validateSelectionLimits(data);
    const group = await this.repository.updateAddOnGroup(
      restaurantId,
      groupId,
      data,
    );
    if (!group) throw new NotFoundException('Add-on group not found');
    return group;
  }

  async deleteAddOnGroup(restaurantId: string, groupId: string) {
    if (!(await this.repository.deleteAddOnGroup(restaurantId, groupId))) {
      throw new NotFoundException('Add-on group not found');
    }
  }

  async createAddOn(
    restaurantId: string,
    groupId: string,
    data: CreateAddOnDto,
  ) {
    const addOn = await this.repository.createAddOn(
      restaurantId,
      groupId,
      data,
    );
    if (!addOn) throw new NotFoundException('Add-on group not found');
    return { ...addOn, price: serializeMoney(addOn.price) };
  }

  async updateAddOn(
    restaurantId: string,
    addOnId: string,
    data: UpdateAddOnDto,
  ) {
    this.requireChanges(data);
    const addOn = await this.repository.updateAddOn(
      restaurantId,
      addOnId,
      data,
    );
    if (!addOn) throw new NotFoundException('Add-on not found');
    return { ...addOn, price: serializeMoney(addOn.price) };
  }

  async deleteAddOn(restaurantId: string, addOnId: string) {
    if (!(await this.repository.deleteAddOn(restaurantId, addOnId))) {
      throw new NotFoundException('Add-on not found');
    }
  }

  async attachAddOnGroup(
    restaurantId: string,
    itemId: string,
    groupId: string,
  ) {
    const link = await this.repository.attachAddOnGroup(
      restaurantId,
      itemId,
      groupId,
    );
    if (!link)
      throw new NotFoundException('Menu item or add-on group not found');
    return link;
  }

  async detachAddOnGroup(
    restaurantId: string,
    itemId: string,
    groupId: string,
  ) {
    if (
      !(await this.repository.detachAddOnGroup(restaurantId, itemId, groupId))
    ) {
      throw new NotFoundException('Menu item add-on group not found');
    }
  }

  private validateSelectionLimits(data: {
    minSelection?: number;
    maxSelection?: number;
  }) {
    if (
      data.minSelection !== undefined &&
      data.maxSelection !== undefined &&
      data.maxSelection < data.minSelection
    ) {
      throw new BadRequestException(
        'Maximum selection must be at least the minimum selection',
      );
    }
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
