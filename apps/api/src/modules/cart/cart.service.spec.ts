import { ConflictException } from '@nestjs/common';
import { Prisma } from '@restaurant/database/generated';
import type { PrismaService } from '../../prisma/prisma.service';
import { MenuAvailabilityService } from '../menu/menu-availability.service';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  let prismaMock: any;
  let menuAvailabilityService: MenuAvailabilityService;

  beforeEach(() => {
    prismaMock = {
      restaurant: { findFirst: jest.fn() },
      menuItem: { findFirst: jest.fn() },
      cart: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      cartItem: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        aggregate: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prismaMock)),
    };
    menuAvailabilityService = new MenuAvailabilityService(prismaMock as unknown as PrismaService);
    service = new CartService(prismaMock as unknown as PrismaService, menuAvailabilityService);
  });

  describe('addItem', () => {
    it('adds item to cart calculating canonical pricing with MenuAvailabilityService', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
        restaurantId: 'rest-1',
        version: 1,
        restaurant: { settings: { taxRate: new Prisma.Decimal('14') } },
      });

      prismaMock.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        name: 'Gourmet Pizza',
        basePrice: new Prisma.Decimal('15.00'),
        categoryId: 'cat-1',
        variants: [
          {
            id: 'v-crust',
            name: 'Crust',
            options: [{ id: 'opt-stuffed', name: 'Stuffed', priceAdjustment: new Prisma.Decimal('3.00') }],
          },
        ],
        addOnGroups: [],
      });

      prismaMock.cartItem.findUnique.mockResolvedValue(null);
      prismaMock.cartItem.aggregate.mockResolvedValue({ _sum: { totalPrice: new Prisma.Decimal('18.00') } });
      prismaMock.cart.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.cart.findUniqueOrThrow.mockResolvedValue({
        id: 'cart-1',
        subtotal: new Prisma.Decimal('18.00'),
        tax: new Prisma.Decimal('2.52'),
        discount: new Prisma.Decimal('0.00'),
        total: new Prisma.Decimal('20.52'),
        items: [],
      });

      const result = await service.addItem('user-1', 'cart-1', {
        menuItemId: 'item-1',
        quantity: 1,
        version: 1,
        variantOptionIds: ['opt-stuffed'],
      });

      expect(result.subtotal).toBe('18.00');
      expect(prismaMock.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            unitPrice: new Prisma.Decimal('18.00'),
            totalPrice: new Prisma.Decimal('18.00'),
          }),
        }),
      );
    });

    it('rejects adding unavailable item', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
        restaurantId: 'rest-1',
        version: 1,
        restaurant: { settings: { taxRate: new Prisma.Decimal('14') } },
      });

      prismaMock.menuItem.findFirst.mockResolvedValue(null);

      await expect(
        service.addItem('user-1', 'cart-1', {
          menuItemId: 'unavailable-item',
          quantity: 1,
          version: 1,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('revalidate', () => {
    it('detects price change and updates cart item prices', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
        restaurantId: 'rest-1',
        version: 1,
        restaurant: { settings: { taxRate: new Prisma.Decimal('14') } },
      });

      prismaMock.cartItem.findMany.mockResolvedValue([
        {
          id: 'ci-1',
          menuItemId: 'item-1',
          quantity: 2,
          unitPrice: new Prisma.Decimal('10.00'),
          totalPrice: new Prisma.Decimal('20.00'),
          variantOptions: [],
          addOns: [],
        },
      ]);

      // Price updated to 12.00
      prismaMock.menuItem.findFirst.mockResolvedValue({
        id: 'item-1',
        name: 'Burger',
        basePrice: new Prisma.Decimal('12.00'),
        categoryId: 'cat-1',
        variants: [],
        addOnGroups: [],
      });

      prismaMock.cartItem.aggregate.mockResolvedValue({ _sum: { totalPrice: new Prisma.Decimal('24.00') } });
      prismaMock.cart.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.cart.findUniqueOrThrow.mockResolvedValue({
        id: 'cart-1',
        subtotal: new Prisma.Decimal('24.00'),
        tax: new Prisma.Decimal('3.36'),
        discount: new Prisma.Decimal('0.00'),
        total: new Prisma.Decimal('27.36'),
        items: [],
      });

      const { changes } = await service.revalidate('user-1', 'cart-1', 1);
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        cartItemId: 'ci-1',
        previousUnitPrice: '10.00',
        unitPrice: '12.00',
      });
      expect(prismaMock.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'ci-1' },
        data: {
          unitPrice: new Prisma.Decimal('12.00'),
          totalPrice: new Prisma.Decimal('24.00'),
        },
      });
    });
  });
});
