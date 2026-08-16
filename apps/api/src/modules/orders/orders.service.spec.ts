import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, OrderType, PaymentMethod, Prisma } from '@restaurant/database/generated';
import type { PrismaService } from '../../prisma/prisma.service';
import type { RealtimeGateway } from '../../common/realtime/realtime.gateway';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaMock: any;
  let realtimeGatewayMock: any;

  beforeEach(() => {
    prismaMock = {
      restaurant: { findFirst: jest.fn() },
      cart: { findFirst: jest.fn(), update: jest.fn() },
      cartItem: { deleteMany: jest.fn() },
      restaurantTable: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      address: { findFirst: jest.fn(), create: jest.fn() },
      coupon: { findUnique: jest.fn(), update: jest.fn() },
      order: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      payment: { updateMany: jest.fn() },
      activityLog: { create: jest.fn() },
      $transaction: jest.fn((cb) => cb({
        order: { create: jest.fn().mockResolvedValue({ id: 'order-1', orderNumber: 'NOR-260817-1234' }) },
        payment: { create: jest.fn() },
        couponUsage: { create: jest.fn() },
        coupon: { update: jest.fn() },
        cart: { update: jest.fn() },
        cartItem: { deleteMany: jest.fn() },
        restaurantTable: { update: jest.fn() },
        activityLog: { create: jest.fn() },
      })),
    };

    realtimeGatewayMock = {
      emitToRestaurant: jest.fn(),
      emitToUser: jest.fn(),
    };

    service = new OrdersService(
      prismaMock as unknown as PrismaService,
      realtimeGatewayMock as unknown as RealtimeGateway,
    );
  });

  describe('checkout', () => {
    it('throws NotFoundException if restaurant does not exist or inactive', async () => {
      prismaMock.restaurant.findFirst.mockResolvedValue(null);

      await expect(
        service.checkout('user-1', {
          restaurantId: 'invalid-rest',
          type: OrderType.TAKEAWAY,
          paymentMethod: PaymentMethod.CARD,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if cart is empty', async () => {
      prismaMock.restaurant.findFirst.mockResolvedValue({
        id: 'rest-1',
        slug: 'nordic-table',
        currency: 'EUR',
        settings: { acceptsOrders: true },
      });
      prismaMock.cart.findFirst.mockResolvedValue(null);

      await expect(
        service.checkout('user-1', {
          restaurantId: 'rest-1',
          type: OrderType.TAKEAWAY,
          paymentMethod: PaymentMethod.CARD,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully processes checkout and emits realtime events', async () => {
      prismaMock.restaurant.findFirst.mockResolvedValue({
        id: 'rest-1',
        slug: 'nordic-table',
        currency: 'EUR',
        settings: { acceptsOrders: true, taxRate: new Prisma.Decimal('14'), minimumOrder: new Prisma.Decimal('0') },
      });

      prismaMock.cart.findFirst.mockResolvedValue({
        id: 'cart-1',
        subtotal: new Prisma.Decimal('20.00'),
        items: [
          {
            menuItemId: 'item-1',
            quantity: 1,
            unitPrice: new Prisma.Decimal('20.00'),
            totalPrice: new Prisma.Decimal('20.00'),
            menuItem: { name: 'Salmon Soup' },
            variantOptions: [],
            addOns: [],
          },
        ],
      });

      const mockFullOrder = {
        id: 'order-1',
        orderNumber: 'NOR-260817-1234',
        restaurantId: 'rest-1',
        userId: 'user-1',
        type: OrderType.TAKEAWAY,
        status: OrderStatus.PENDING,
        subtotal: new Prisma.Decimal('20.00'),
        tax: new Prisma.Decimal('2.80'),
        discount: new Prisma.Decimal('0.00'),
        total: new Prisma.Decimal('22.80'),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'oi-1',
            name: 'Salmon Soup',
            quantity: 1,
            unitPrice: new Prisma.Decimal('20.00'),
            totalPrice: new Prisma.Decimal('20.00'),
            variantOptions: [],
            addOns: [],
          },
        ],
        restaurant: { id: 'rest-1', name: 'Nordic Table' },
        user: { id: 'user-1', email: 'customer@test.com', profile: { firstName: 'Test', lastName: 'Customer' } },
        table: null,
        payment: { id: 'pay-1', amount: new Prisma.Decimal('22.80'), method: PaymentMethod.CARD, status: 'PAID' },
        history: [],
        couponUsage: null,
      };

      prismaMock.order.findUniqueOrThrow.mockResolvedValue(mockFullOrder);

      const result = await service.checkout('user-1', {
        restaurantId: 'rest-1',
        type: OrderType.TAKEAWAY,
        paymentMethod: PaymentMethod.CARD,
      });

      expect(result.id).toBe('order-1');
      expect(result.total).toBe('22.80');
      expect(realtimeGatewayMock.emitToRestaurant).toHaveBeenCalledWith(
        'rest-1',
        'order:created',
        expect.any(Object),
      );
      expect(realtimeGatewayMock.emitToUser).toHaveBeenCalledWith(
        'user-1',
        'order:created',
        expect.any(Object),
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('validates invalid status transitions', async () => {
      prismaMock.order.findFirst.mockResolvedValue({
        id: 'order-1',
        restaurantId: 'rest-1',
        status: OrderStatus.PENDING,
      });

      await expect(
        service.updateOrderStatus(
          'rest-1',
          'order-1',
          { status: OrderStatus.SERVED },
          'staff-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows valid status transitions and updates order', async () => {
      const currentOrder = {
        id: 'order-1',
        orderNumber: 'NOR-260817-1234',
        restaurantId: 'rest-1',
        status: OrderStatus.PENDING,
        tableId: null,
      };
      prismaMock.order.findFirst.mockResolvedValue(currentOrder);

      const updatedOrder = {
        ...currentOrder,
        userId: 'user-1',
        status: OrderStatus.PREPARING,
        subtotal: new Prisma.Decimal('20.00'),
        tax: new Prisma.Decimal('2.80'),
        discount: new Prisma.Decimal('0.00'),
        total: new Prisma.Decimal('22.80'),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        payment: null,
        couponUsage: null,
        user: { id: 'user-1' },
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) =>
        cb({
          order: { update: jest.fn().mockResolvedValue(updatedOrder) },
          activityLog: { create: jest.fn() },
        }),
      );

      const res = await service.updateOrderStatus(
        'rest-1',
        'order-1',
        { status: OrderStatus.PREPARING },
        'staff-1',
      );

      expect(res.status).toBe(OrderStatus.PREPARING);
      expect(realtimeGatewayMock.emitToRestaurant).toHaveBeenCalledWith(
        'rest-1',
        'order:status_changed',
        expect.any(Object),
      );
    });
  });
});
