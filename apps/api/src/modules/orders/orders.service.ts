import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@restaurant/database/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../common/realtime/realtime.gateway';
import { MenuAvailabilityService } from '../menu/menu-availability.service';
import type {
  CheckoutDto,
  OrderFilterDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';

const fixed = (value: Prisma.Decimal | number | string) =>
  Number(value).toFixed(2);

const orderInclude = {
  restaurant: {
    select: {
      id: true,
      name: true,
      slug: true,
      currency: true,
      phone: true,
      addresses: { where: { isPrimary: true }, take: 1 },
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
  table: {
    select: {
      id: true,
      tableNumber: true,
      capacity: true,
    },
  },
  deliveryAddress: true,
  items: {
    include: {
      variantOptions: true,
      addOns: true,
    },
  },
  payment: true,
  history: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      changedBy: {
        select: {
          id: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
  couponUsage: {
    include: {
      coupon: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          value: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly menuAvailabilityService: MenuAvailabilityService,
  ) {}

  async checkout(userId: string, data: CheckoutDto) {
    const restaurant = await this.menuAvailabilityService.validateRestaurantAcceptingOrders(
      this.prisma,
      data.restaurantId,
    );

    // Retrieve active cart with detailed items
    const cart = await this.prisma.cart.findFirst({
      where: {
        userId,
        restaurantId: data.restaurantId,
        status: 'ACTIVE',
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                media: {
                  take: 1,
                  orderBy: { sortOrder: 'asc' as const },
                  select: { alt: true, media: { select: { url: true } } },
                },
                category: { select: { id: true, name: true } },
              },
            },
            variantOptions: {
              include: {
                option: {
                  select: {
                    id: true,
                    name: true,
                    variant: { select: { id: true, name: true } },
                  },
                },
              },
            },
            addOns: {
              include: {
                addOn: {
                  select: {
                    id: true,
                    name: true,
                    group: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    // Revalidate live availability and price parity for all items in the cart
    await this.menuAvailabilityService.validateCartItems(
      this.prisma,
      data.restaurantId,
      cart.items,
    );

    // Minimum order check for takeaway/delivery
    const subtotalNum = Number(cart.subtotal);
    if (
      restaurant.settings &&
      data.type !== OrderType.DINE_IN &&
      Number(restaurant.settings.minimumOrder) > 0 &&
      subtotalNum < Number(restaurant.settings.minimumOrder)
    ) {
      throw new BadRequestException(
        `Minimum order amount is €${Number(restaurant.settings.minimumOrder).toFixed(2)}`,
      );
    }

    // Handle Table for Dine-In
    let tableId: string | null = null;
    if (data.type === OrderType.DINE_IN) {
      if (data.tableId) {
        const table = await this.prisma.restaurantTable.findFirst({
          where: { id: data.tableId, restaurantId: data.restaurantId },
        });
        if (!table) throw new BadRequestException('Selected table does not exist');
        tableId = table.id;
      } else if (data.tableNumber) {
        const table = await this.prisma.restaurantTable.findUnique({
          where: {
            restaurantId_tableNumber: {
              restaurantId: data.restaurantId,
              tableNumber: data.tableNumber,
            },
          },
        });
        if (!table) throw new BadRequestException(`Table ${data.tableNumber} does not exist`);
        tableId = table.id;
      }
    }

    // Handle Delivery Address
    let deliveryAddressId: string | null = null;
    if (data.type === OrderType.DELIVERY) {
      if (data.deliveryAddressId) {
        const address = await this.prisma.address.findFirst({
          where: { id: data.deliveryAddressId, userId },
        });
        if (!address) throw new BadRequestException('Delivery address not found');
        deliveryAddressId = address.id;
      } else if (data.deliveryAddress) {
        const createdAddress = await this.prisma.address.create({
          data: {
            userId,
            label: 'Delivery',
            street: data.deliveryAddress.street,
            city: data.deliveryAddress.city,
            postalCode: data.deliveryAddress.postalCode ?? '00000',
            country: data.deliveryAddress.country,
          },
        });
        deliveryAddressId = createdAddress.id;
      } else {
        throw new BadRequestException('Delivery address is required for delivery orders');
      }
    }

    // Handle Coupon if provided
    let discountAmount = new Prisma.Decimal(0);
    let appliedCouponId: string | null = null;
    if (data.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: data.couponCode.trim().toUpperCase() },
      });

      if (!coupon || !coupon.isActive || (coupon.expiresAt && coupon.expiresAt < new Date())) {
        throw new BadRequestException('Invalid or expired coupon code');
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new BadRequestException('Coupon usage limit reached');
      }

      if (coupon.minimumOrder !== null && subtotalNum < Number(coupon.minimumOrder)) {
        throw new BadRequestException(
          `Coupon requires a minimum order of €${Number(coupon.minimumOrder).toFixed(2)}`,
        );
      }

      if (coupon.type === 'PERCENTAGE') {
        const calc = (subtotalNum * Number(coupon.value)) / 100;
        const max = coupon.maximumDiscount ? Number(coupon.maximumDiscount) : calc;
        discountAmount = new Prisma.Decimal(Math.min(calc, max).toFixed(2));
      } else {
        discountAmount = new Prisma.Decimal(Math.min(subtotalNum, Number(coupon.value)).toFixed(2));
      }

      appliedCouponId = coupon.id;
    }

    // Calculate final totals
    const deliveryFee =
      data.type === OrderType.DELIVERY && restaurant.settings
        ? Number(restaurant.settings.deliveryFee)
        : 0;
    const serviceFee =
      restaurant.settings ? Number(restaurant.settings.serviceFee) : 0;
    const taxRate = restaurant.settings ? Number(restaurant.settings.taxRate) : 14;

    const finalSubtotal = new Prisma.Decimal(cart.subtotal);
    const taxableAmount = Math.max(0, subtotalNum - Number(discountAmount) + serviceFee);
    const finalTax = new Prisma.Decimal(((taxableAmount * taxRate) / 100).toFixed(2));
    const finalTotal = new Prisma.Decimal(
      (taxableAmount + Number(finalTax) + deliveryFee).toFixed(2),
    );

    const orderNumber = this.generateOrderNumber(restaurant.slug);

    const restaurantSnapshot = {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      currency: restaurant.currency,
      settings: restaurant.settings
        ? {
            taxRate: fixed(restaurant.settings.taxRate ?? 0),
            deliveryFee: fixed(restaurant.settings.deliveryFee ?? 0),
            serviceFee: fixed(restaurant.settings.serviceFee ?? 0),
            minimumOrder: fixed(restaurant.settings.minimumOrder ?? 0),
          }
        : null,
    };

    // Run order creation in a single transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          restaurantId: data.restaurantId,
          tableId,
          deliveryAddressId,
          type: data.type,
          status: OrderStatus.PENDING,
          notes: data.notes?.trim() || null,
          subtotal: finalSubtotal,
          tax: finalTax,
          discount: discountAmount,
          total: finalTotal,
          restaurantSnapshot,
          items: {
            create: cart.items.map((item) => {
              const itemSnapshot = {
                menuItemId: item.menuItemId,
                name: item.menuItem.name,
                unitPrice: fixed(item.unitPrice),
                totalPrice: fixed(item.totalPrice),
                quantity: item.quantity,
                notes: item.notes,
                categoryName: item.menuItem.category?.name ?? null,
                mediaUrl: item.menuItem.media?.[0]?.media?.url ?? null,
                mediaAlt: item.menuItem.media?.[0]?.alt ?? null,
                variantOptions: item.variantOptions.map((vo) => ({
                  optionId: vo.optionId,
                  name: vo.option?.name ?? '',
                  variantName: vo.option?.variant?.name ?? null,
                  priceAdjustment: fixed(vo.priceAdjustment),
                })),
                addOns: item.addOns.map((ao) => ({
                  addOnId: ao.addOnId,
                  name: ao.addOn?.name ?? '',
                  groupName: ao.addOn?.group?.name ?? null,
                  quantity: ao.quantity,
                  price: fixed(ao.price),
                })),
              };

              return {
                menuItemId: item.menuItemId,
                name: item.menuItem.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                itemSnapshot,
                variantOptions: {
                  create: item.variantOptions.map((vo) => ({
                    optionId: vo.optionId,
                    name: vo.option?.name ?? '',
                    variantName: vo.option?.variant?.name ?? null,
                    priceAdjustment: vo.priceAdjustment,
                  })),
                },
                addOns: {
                  create: item.addOns.map((ao) => ({
                    addOnId: ao.addOnId,
                    name: ao.addOn?.name ?? '',
                    groupName: ao.addOn?.group?.name ?? null,
                    quantity: ao.quantity,
                    price: ao.price,
                  })),
                },
              };
            }),
          },
          history: {
            create: {
              status: OrderStatus.PENDING,
              changedById: userId,
              notes: 'Order placed by customer',
            },
          },
        },
      });

      // Handle Coupon Usage
      if (appliedCouponId) {
        await tx.couponUsage.create({
          data: {
            couponId: appliedCouponId,
            orderId: createdOrder.id,
            userId,
            discount: discountAmount,
          },
        });
        await tx.coupon.update({
          where: { id: appliedCouponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Handle Payment
      const isSimulatedPaid =
        data.paymentMethod === PaymentMethod.CARD ||
        data.paymentMethod === PaymentMethod.APPLE_PAY ||
        data.paymentMethod === PaymentMethod.GOOGLE_PAY ||
        data.paymentMethod === PaymentMethod.STRIPE;

      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          method: data.paymentMethod,
          status: isSimulatedPaid ? PaymentStatus.PAID : PaymentStatus.PENDING,
          amount: finalTotal,
          currency: restaurant.currency,
          paidAt: isSimulatedPaid ? new Date() : null,
        },
      });

      // Update Cart Status
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: 'CHECKED_OUT' },
      });

      // Delete checked out cart items so cart starts fresh
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Mark Table as OCCUPIED if dine-in
      if (tableId) {
        await tx.restaurantTable.update({
          where: { id: tableId },
          data: { status: 'OCCUPIED' },
        });
      }

      // Activity log
      await tx.activityLog.create({
        data: {
          userId,
          restaurantId: data.restaurantId,
          type: 'ORDER',
          action: 'CREATE',
          entityType: 'Order',
          entityId: createdOrder.id,
          description: `Order ${orderNumber} created (${data.type})`,
        },
      });

      return createdOrder;
    });

    const fullOrder = await this.prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: orderInclude,
    });

    // Realtime notification
    this.emitOrderEvents(fullOrder, 'order:created');

    return this.serializeOrder(fullOrder);
  }

  async getCustomerOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });

    return orders.map((order) => this.serializeOrder(order));
  }

  async getCustomerOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.serializeOrder(order);
  }

  async getCustomerOrderByNumber(userId: string, orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber,
        userId,
      },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.serializeOrder(order);
  }

  async getRestaurantOrders(restaurantId: string, filter: OrderFilterDto) {
    const where: Prisma.OrderWhereInput = {
      restaurantId,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.type ? { type: filter.type } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter.limit ?? 50,
        skip: filter.offset ?? 0,
        include: orderInclude,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: items.map((order) => this.serializeOrder(order)),
      total,
      limit: filter.limit ?? 50,
      offset: filter.offset ?? 0,
    };
  }

  async getRestaurantOrder(restaurantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId,
      },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.serializeOrder(order);
  }

  async updateOrderStatus(
    restaurantId: string,
    orderId: string,
    data: UpdateOrderStatusDto,
    changedById: string,
  ) {
    const currentOrder = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
      include: { table: true },
    });

    if (!currentOrder) {
      throw new NotFoundException('Order not found');
    }

    this.validateStatusTransition(currentOrder.status, data.status);

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: data.status,
          history: {
            create: {
              status: data.status,
              changedById,
              notes: data.notes?.trim() || `Status changed to ${data.status}`,
            },
          },
        },
        include: orderInclude,
      });

      // Free table if order is completed or cancelled
      if (
        (data.status === OrderStatus.COMPLETED ||
          data.status === OrderStatus.CANCELLED) &&
        currentOrder.tableId
      ) {
        await tx.restaurantTable.update({
          where: { id: currentOrder.tableId },
          data: { status: 'AVAILABLE' },
        });
      }

      // If cancelled and payment was paid, mark payment refunded
      if (data.status === OrderStatus.CANCELLED) {
        await tx.payment.updateMany({
          where: { orderId, status: PaymentStatus.PAID },
          data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: changedById,
          restaurantId,
          type: 'ORDER',
          action: 'STATUS_CHANGED',
          entityType: 'Order',
          entityId: orderId,
          description: `Order ${currentOrder.orderNumber} status changed from ${currentOrder.status} to ${data.status}`,
        },
      });

      return updated;
    });

    this.emitOrderEvents(updatedOrder, 'order:status_changed');

    return this.serializeOrder(updatedOrder);
  }

  private validateStatusTransition(from: OrderStatus, to: OrderStatus) {
    if (from === to) return;

    if (to === OrderStatus.CANCELLED) {
      if (from === OrderStatus.COMPLETED || from === OrderStatus.REFUNDED) {
        throw new BadRequestException(`Cannot cancel a ${from.toLowerCase()} order`);
      }
      return;
    }

    const flow: Record<OrderStatus, OrderStatus[]> = {
      PENDING: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.CANCELLED],
      CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
      READY: [OrderStatus.SERVED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      SERVED: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      COMPLETED: [OrderStatus.REFUNDED],
      CANCELLED: [OrderStatus.REFUNDED],
      REFUNDED: [],
    };

    const allowed = flow[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Invalid status transition from ${from} to ${to}`,
      );
    }
  }

  private generateOrderNumber(slug: string): string {
    const prefix = slug.substring(0, 3).toUpperCase();
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${dateStr}-${rand}`;
  }

  private emitOrderEvents(
    order: any,
    eventName: 'order:created' | 'order:status_changed' | 'order:updated',
  ) {
    const customerName = order.user?.profile
      ? `${order.user.profile.firstName} ${order.user.profile.lastName}`.trim()
      : order.user?.email;

    const eventPayload = {
      event: eventName,
      restaurantId: order.restaurantId,
      occurredAt: new Date().toISOString(),
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          restaurantId: order.restaurantId,
          userId: order.userId,
          type: order.type,
          status: order.status,
          total: fixed(order.total),
          tableNumber: order.table?.tableNumber ?? null,
          customerName: customerName ?? 'Guest',
          itemCount: order.items.reduce(
            (acc: number, item: any) => acc + item.quantity,
            0,
          ),
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        },
      },
    };

    // Emit to staff in restaurant room
    this.realtimeGateway.emitToRestaurant(
      order.restaurantId,
      eventName,
      eventPayload as any,
    );

    // Emit to customer in user room
    this.realtimeGateway.emitToUser(
      order.userId,
      eventName,
      eventPayload as any,
    );
  }

  private serializeOrder(order: any) {
    return {
      ...order,
      subtotal: fixed(order.subtotal),
      tax: fixed(order.tax),
      discount: fixed(order.discount),
      total: fixed(order.total),
      items: order.items.map((item: any) => ({
        ...item,
        unitPrice: fixed(item.unitPrice),
        totalPrice: fixed(item.totalPrice),
        variantOptions: item.variantOptions.map((vo: any) => ({
          ...vo,
          priceAdjustment: fixed(vo.priceAdjustment),
        })),
        addOns: item.addOns.map((ao: any) => ({
          ...ao,
          price: fixed(ao.price),
        })),
      })),
      payment: order.payment
        ? {
            ...order.payment,
            amount: fixed(order.payment.amount),
          }
        : null,
      couponUsage: order.couponUsage
        ? {
            ...order.couponUsage,
            discount: fixed(order.couponUsage.discount),
          }
        : null,
    };
  }
}
