import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@restaurant/database/generated';
import type { PrismaService } from '../../prisma/prisma.service';
import { MenuAvailabilityService } from './menu-availability.service';

describe('MenuAvailabilityService', () => {
  let service: MenuAvailabilityService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      restaurant: { findFirst: jest.fn() },
      menuItem: { findFirst: jest.fn() },
    };
    service = new MenuAvailabilityService(prismaMock as unknown as PrismaService);
  });

  describe('validateRestaurantAcceptingOrders', () => {
    it('returns restaurant when active and accepting orders', async () => {
      prismaMock.restaurant.findFirst.mockResolvedValue({
        id: 'rest-1',
        name: 'Nordic Feast',
        slug: 'nordic-feast',
        currency: 'EUR',
        settings: { acceptsOrders: true, taxRate: new Prisma.Decimal('14') },
      });

      const result = await service.validateRestaurantAcceptingOrders(prismaMock, 'rest-1');
      expect(result.id).toBe('rest-1');
      expect(result.settings?.acceptsOrders).toBe(true);
    });

    it('throws ConflictException if restaurant is inactive or not found', async () => {
      prismaMock.restaurant.findFirst.mockResolvedValue(null);

      await expect(
        service.validateRestaurantAcceptingOrders(prismaMock, 'rest-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws ConflictException if restaurant is not accepting orders', async () => {
      prismaMock.restaurant.findFirst.mockResolvedValue({
        id: 'rest-1',
        settings: { acceptsOrders: false },
      });

      await expect(
        service.validateRestaurantAcceptingOrders(prismaMock, 'rest-1'),
      ).rejects.toThrow('Restaurant is not currently accepting orders');
    });
  });

  describe('validateItemSelection', () => {
    it('calculates canonical unit price with variants and add-ons', async () => {
      prismaMock.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        name: 'Gourmet Burger',
        basePrice: new Prisma.Decimal('12.00'),
        categoryId: 'cat-1',
        variants: [
          {
            id: 'v-size',
            name: 'Size',
            options: [
              { id: 'opt-reg', name: 'Regular', priceAdjustment: new Prisma.Decimal('0.00') },
              { id: 'opt-large', name: 'Large', priceAdjustment: new Prisma.Decimal('3.50') },
            ],
          },
        ],
        addOnGroups: [
          {
            group: {
              id: 'grp-sauce',
              name: 'Sauces',
              required: false,
              minSelection: 0,
              maxSelection: 3,
              addOns: [
                { id: 'addon-truffle', name: 'Truffle Mayo', price: new Prisma.Decimal('1.50'), isAvailable: true },
                { id: 'addon-garlic', name: 'Garlic Aioli', price: new Prisma.Decimal('1.00'), isAvailable: true },
              ],
            },
          },
        ],
      });

      const result = await service.validateItemSelection(prismaMock, 'rest-1', {
        menuItemId: 'item-1',
        variantOptionIds: ['opt-large'],
        addOns: [
          { addOnId: 'addon-truffle', quantity: 2 },
          { addOnId: 'addon-garlic', quantity: 1 },
        ],
      });

      // 12.00 (base) + 3.50 (large) + (1.50 * 2 = 3.00) + (1.00 * 1 = 1.00) = 19.50
      expect(result.unitPrice.toFixed(2)).toBe('19.50');
      expect(result.options).toHaveLength(1);
      expect(result.options[0]!.name).toBe('Large');
      expect(result.addOns).toHaveLength(2);
      expect(result.addOns[0]!.name).toBe('Truffle Mayo');
      expect(result.addOns[0]!.quantity).toBe(2);
    });

    it('rejects if item is not found or unavailable', async () => {
      prismaMock.menuItem.findFirst.mockResolvedValue(null);

      await expect(
        service.validateItemSelection(prismaMock, 'rest-1', { menuItemId: 'invalid-item' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects multiple selections from the same variant', async () => {
      prismaMock.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        name: 'Gourmet Burger',
        basePrice: new Prisma.Decimal('12.00'),
        categoryId: 'cat-1',
        variants: [
          {
            id: 'v-size',
            name: 'Size',
            options: [
              { id: 'opt-reg', name: 'Regular', priceAdjustment: new Prisma.Decimal('0.00') },
              { id: 'opt-large', name: 'Large', priceAdjustment: new Prisma.Decimal('3.50') },
            ],
          },
        ],
        addOnGroups: [],
      });

      await expect(
        service.validateItemSelection(prismaMock, 'rest-1', {
          menuItemId: 'item-1',
          variantOptionIds: ['opt-reg', 'opt-large'],
        }),
      ).rejects.toThrow('Select at most one option from variant "Size"');
    });

    it('rejects variant options not belonging to the item', async () => {
      prismaMock.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        name: 'Gourmet Burger',
        basePrice: new Prisma.Decimal('12.00'),
        categoryId: 'cat-1',
        variants: [],
        addOnGroups: [],
      });

      await expect(
        service.validateItemSelection(prismaMock, 'rest-1', {
          menuItemId: 'item-1',
          variantOptionIds: ['foreign-opt-id'],
        }),
      ).rejects.toThrow('A selected variant option does not belong to this item');
    });

    it('rejects out of stock add-ons', async () => {
      prismaMock.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        name: 'Gourmet Burger',
        basePrice: new Prisma.Decimal('12.00'),
        categoryId: 'cat-1',
        variants: [],
        addOnGroups: [
          {
            group: {
              id: 'grp-sauce',
              name: 'Sauces',
              required: false,
              minSelection: 0,
              maxSelection: 2,
              addOns: [
                { id: 'addon-truffle', name: 'Truffle Mayo', price: new Prisma.Decimal('1.50'), isAvailable: false },
              ],
            },
          },
        ],
      });

      await expect(
        service.validateItemSelection(prismaMock, 'rest-1', {
          menuItemId: 'item-1',
          addOns: [{ addOnId: 'addon-truffle', quantity: 1 }],
        }),
      ).rejects.toThrow('Add-on "Truffle Mayo" is currently out of stock');
    });

    it('enforces required add-on group selection boundaries', async () => {
      prismaMock.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        name: 'Gourmet Burger',
        basePrice: new Prisma.Decimal('12.00'),
        categoryId: 'cat-1',
        variants: [],
        addOnGroups: [
          {
            group: {
              id: 'grp-sides',
              name: 'Sides',
              required: true,
              minSelection: 1,
              maxSelection: 2,
              addOns: [
                { id: 'addon-fries', name: 'French Fries', price: new Prisma.Decimal('3.00'), isAvailable: true },
              ],
            },
          },
        ],
      });

      // 0 selected when minSelection is 1
      await expect(
        service.validateItemSelection(prismaMock, 'rest-1', {
          menuItemId: 'item-1',
          addOns: [],
        }),
      ).rejects.toThrow('Required add-on group "Sides" selections must be between 1 and 2');

      // 3 selected when maxSelection is 2
      await expect(
        service.validateItemSelection(prismaMock, 'rest-1', {
          menuItemId: 'item-1',
          addOns: [{ addOnId: 'addon-fries', quantity: 3 }],
        }),
      ).rejects.toThrow('Required add-on group "Sides" selections must be between 1 and 2');
    });

    it('rejects duplicate add-on entries in the same selection', async () => {
      await expect(
        service.validateItemSelection(prismaMock, 'rest-1', {
          menuItemId: 'item-1',
          addOns: [
            { addOnId: 'addon-1', quantity: 1 },
            { addOnId: 'addon-1', quantity: 2 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('validateCartItems', () => {
    it('passes when all cart items match canonical prices', async () => {
      prismaMock.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        name: 'Salmon Soup',
        basePrice: new Prisma.Decimal('15.00'),
        categoryId: 'cat-1',
        variants: [],
        addOnGroups: [],
      });

      const cartItems = [
        {
          id: 'cart-item-1',
          menuItemId: 'item-1',
          quantity: 2,
          unitPrice: new Prisma.Decimal('15.00'),
          totalPrice: new Prisma.Decimal('30.00'),
          variantOptions: [],
          addOns: [],
          menuItem: { name: 'Salmon Soup' },
        },
      ];

      const validated = await service.validateCartItems(prismaMock, 'rest-1', cartItems);
      expect(validated).toHaveLength(1);
      expect(validated[0]!.validated.unitPrice.toFixed(2)).toBe('15.00');
    });

    it('throws ConflictException if cart item unit price differs from live canonical price', async () => {
      prismaMock.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        name: 'Salmon Soup',
        basePrice: new Prisma.Decimal('18.00'), // price increased from 15 to 18
        categoryId: 'cat-1',
        variants: [],
        addOnGroups: [],
      });

      const cartItems = [
        {
          id: 'cart-item-1',
          menuItemId: 'item-1',
          quantity: 1,
          unitPrice: new Prisma.Decimal('15.00'),
          totalPrice: new Prisma.Decimal('15.00'),
          variantOptions: [],
          addOns: [],
          menuItem: { name: 'Salmon Soup' },
        },
      ];

      await expect(
        service.validateCartItems(prismaMock, 'rest-1', cartItems),
      ).rejects.toThrow('Price for "Salmon Soup" has changed from €15.00 to €18.00. Please refresh your cart.');
    });
  });
});
