import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@restaurant/database/generated';
import type { MenuRepository } from './menu.repository';
import { MenuService } from './menu.service';
import type { RealtimeGateway } from '../../common/realtime';
import type { UploadService } from '../../common/upload/upload.service';

describe('MenuService', () => {
  const repository = {
    listMenus: jest.fn(),
    createMenu: jest.fn(),
    ensureDefaultMenu: jest.fn(),
    importCsv: jest.fn(),
    getMenu: jest.fn(),
    updateMenu: jest.fn(),
    deleteMenu: jest.fn(),
    listCategories: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    listItems: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: jest.fn(),
  } as unknown as jest.Mocked<MenuRepository>;
  const emitToRestaurant = jest.fn();
  const service = new MenuService(
    repository,
    {
      emitToRestaurant,
    } as unknown as RealtimeGateway,
    {
      uploadImage: jest.fn(),
      deleteQuietly: jest.fn(),
    } as unknown as UploadService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns the standard pagination envelope', async () => {
    repository.listMenus.mockResolvedValue({ data: [], total: 52 });

    await expect(
      service.listMenus('restaurant-1', {
        page: 2,
        limit: 25,
        order: 'desc',
      }),
    ).resolves.toEqual({
      data: [],
      pagination: { page: 2, limit: 25, total: 52, totalPages: 3 },
    });
  });

  it('normalizes duplicate menu names to a conflict', async () => {
    repository.createMenu.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.createMenu('restaurant-1', { name: 'Dinner' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects creating menu when restaurant does not exist or is inactive', async () => {
    repository.createMenu.mockResolvedValue(null);

    await expect(
      service.createMenu('invalid-rest', { name: 'Dinner' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('initializes the default menu for an existing empty restaurant', async () => {
    repository.ensureDefaultMenu.mockResolvedValue({
      id: 'menu-1',
      restaurantId: 'restaurant-1',
      name: 'Main menu',
      description: 'Draft menu created during restaurant setup',
      sortOrder: 0,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: { categories: 0 },
    });

    await expect(service.ensureDefaultMenu('restaurant-1')).resolves.toEqual(
      expect.objectContaining({ name: 'Main menu', isActive: false }),
    );
  });

  it('imports validated CSV rows into the selected menu', async () => {
    repository.importCsv.mockResolvedValue({
      menuId: 'menu-1',
      categoriesCreated: 1,
      itemsCreated: 1,
    });

    await expect(
      service.importCsv('restaurant-1', 'menu-1', {
        rows: [{ category: 'Mains', name: 'Soup', price: 8.5, sku: 'SOUP' }],
      }),
    ).resolves.toEqual({
      menuId: 'menu-1',
      categoriesCreated: 1,
      itemsCreated: 1,
    });
  });

  it('rejects duplicate SKUs before starting a CSV import', async () => {
    await expect(
      service.importCsv('restaurant-1', 'menu-1', {
        rows: [
          { category: 'Mains', name: 'Soup', price: 8.5, sku: 'SOUP' },
          { category: 'Mains', name: 'Stew', price: 9.5, sku: 'soup' },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.importCsv).not.toHaveBeenCalled();
  });

  it('rejects categories that do not resolve through the restaurant menu', async () => {
    repository.createCategory.mockResolvedValue(null);

    await expect(
      service.createCategory('restaurant-1', {
        menuId: 'other-restaurant-menu',
        name: 'Mains',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects items whose category is outside the restaurant boundary', async () => {
    repository.createItem.mockResolvedValue(null);

    await expect(
      service.createItem('restaurant-1', {
        categoryId: 'other-category',
        name: 'Soup',
        price: 9.5,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(emitToRestaurant).not.toHaveBeenCalled();
  });

  it('emits item events only after successful persistence', async () => {
    const item = {
      id: 'item-1',
      restaurantId: 'restaurant-1',
      categoryId: 'category-1',
      name: 'Soup',
      description: null,
      sku: null,
      basePrice: new Prisma.Decimal('8.00'),
      preparationTime: null,
      calories: null,
      isFeatured: false,
      sortOrder: 0,
      status: 'AVAILABLE' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      media: [],
    };
    repository.createItem.mockResolvedValue(item);
    repository.updateItem.mockResolvedValue({
      ...item,
      status: 'UNAVAILABLE',
    });
    repository.deleteItem.mockResolvedValue(true);

    await service.createItem('restaurant-1', {
      categoryId: 'category-1',
      name: 'Soup',
      price: 8,
    });
    await service.updateItem('restaurant-1', 'item-1', {
      status: 'UNAVAILABLE',
    });
    await service.deleteItem('restaurant-1', 'item-1');

    expect(emitToRestaurant).toHaveBeenNthCalledWith(
      1,
      'restaurant-1',
      'menu:item_created',
      expect.objectContaining({
        event: 'menu:item_created',
        data: {
          item: expect.objectContaining({ id: 'item-1', price: '8.00' }),
        },
      }),
    );
    expect(emitToRestaurant).toHaveBeenNthCalledWith(
      2,
      'restaurant-1',
      'menu:item_updated',
      expect.objectContaining({ event: 'menu:item_updated' }),
    );
    expect(emitToRestaurant).toHaveBeenNthCalledWith(
      3,
      'restaurant-1',
      'menu:item_deleted',
      expect.objectContaining({ data: { itemId: 'item-1' } }),
    );
  });
});
