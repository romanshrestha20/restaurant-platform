import type { PrismaService } from '../../prisma/prisma.service';
import { MenuRepository } from './menu.repository';

describe('MenuRepository restaurant boundaries', () => {
  const findRestaurant = jest.fn();
  const findMenu = jest.fn();
  const createCategory = jest.fn();
  const findCategory = jest.fn();
  const createItem = jest.fn();
  const updateItems = jest.fn();
  const findItem = jest.fn();
  const findVariant = jest.fn();
  const createVariant = jest.fn();
  const findOption = jest.fn();
  const createOption = jest.fn();
  const findGroup = jest.fn();
  const createGroup = jest.fn();
  const findAddOn = jest.fn();
  const createAddOn = jest.fn();

  const prisma = {
    restaurant: { findFirst: findRestaurant },
    menu: { findFirst: findMenu },
    category: { findFirst: findCategory, create: createCategory },
    menuItem: {
      findFirst: findItem,
      create: createItem,
      updateMany: updateItems,
      findUnique: findItem,
    },
    variant: { findFirst: findVariant, create: createVariant },
    variantOption: { findFirst: findOption, create: createOption },
    addOnGroup: { findFirst: findGroup, create: createGroup },
    addOn: { findFirst: findAddOn, create: createAddOn },
  } as unknown as PrismaService;
  const repository = new MenuRepository(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('requires restaurant to exist and be active when creating menu', async () => {
    findRestaurant.mockResolvedValue(null);

    await expect(
      repository.createMenu('restaurant-1', { name: 'Brunch' }),
    ).resolves.toBeNull();

    expect(findRestaurant).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'restaurant-1',
          isActive: true,
          deletedAt: null,
        }),
      }),
    );
  });

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

  it('requires the item to belong to the restaurant when creating a variant', async () => {
    findItem.mockResolvedValue(null);

    await expect(
      repository.createVariant('restaurant-1', 'foreign-item', { name: 'Size' }),
    ).resolves.toBeNull();

    expect(findItem).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'foreign-item',
          restaurantId: 'restaurant-1',
        }),
      }),
    );
    expect(createVariant).not.toHaveBeenCalled();
  });

  it('requires the variant to belong to the restaurant when creating a variant option', async () => {
    findVariant.mockResolvedValue(null);

    await expect(
      repository.createVariantOption('restaurant-1', 'foreign-variant', {
        name: 'Large',
        priceAdjustment: 2.5,
      }),
    ).resolves.toBeNull();

    expect(findVariant).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'foreign-variant',
          menuItem: expect.objectContaining({
            restaurantId: 'restaurant-1',
          }),
        }),
      }),
    );
    expect(createOption).not.toHaveBeenCalled();
  });

  it('requires the add-on group to belong to the restaurant when creating an add-on', async () => {
    findGroup.mockResolvedValue(null);

    await expect(
      repository.createAddOn('restaurant-1', 'foreign-group', {
        name: 'Extra Bacon',
        price: 1.5,
      }),
    ).resolves.toBeNull();

    expect(findGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'foreign-group',
          restaurantId: 'restaurant-1',
        }),
      }),
    );
    expect(createAddOn).not.toHaveBeenCalled();
  });
});
