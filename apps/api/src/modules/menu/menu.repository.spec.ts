import type { PrismaService } from '../../prisma/prisma.service';
import { MenuRepository } from './menu.repository';

describe('MenuRepository restaurant boundaries', () => {
  const findMenu = jest.fn();
  const createCategory = jest.fn();
  const findCategory = jest.fn();
  const createItem = jest.fn();
  const updateItems = jest.fn();
  const findItem = jest.fn();
  const prisma = {
    menu: { findFirst: findMenu },
    category: { findFirst: findCategory, create: createCategory },
    menuItem: {
      create: createItem,
      updateMany: updateItems,
      findUnique: findItem,
    },
  } as unknown as PrismaService;
  const repository = new MenuRepository(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('requires the parent menu to belong to the restaurant', async () => {
    findMenu.mockResolvedValue(null);

    await expect(
      repository.createCategory('restaurant-1', {
        menuId: 'menu-2',
        name: 'Mains',
      }),
    ).resolves.toBeNull();

    expect(findMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'menu-2',
          restaurantId: 'restaurant-1',
        }),
      }),
    );
    expect(createCategory).not.toHaveBeenCalled();
  });

  it('requires the parent category to belong to the restaurant', async () => {
    findCategory.mockResolvedValue(null);

    await expect(
      repository.createItem('restaurant-1', {
        categoryId: 'category-2',
        name: 'Soup',
        price: 8,
      }),
    ).resolves.toBeNull();

    expect(findCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'category-2',
          restaurantId: 'restaurant-1',
        }),
      }),
    );
    expect(createItem).not.toHaveBeenCalled();
  });

  it('scopes item updates by both item and restaurant', async () => {
    updateItems.mockResolvedValue({ count: 0 });

    await expect(
      repository.updateItem('restaurant-1', 'item-2', {
        status: 'UNAVAILABLE',
      }),
    ).resolves.toBeNull();

    expect(updateItems).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'item-2',
          restaurantId: 'restaurant-1',
        }),
      }),
    );
    expect(findItem).not.toHaveBeenCalled();
  });
});
