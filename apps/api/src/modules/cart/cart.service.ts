import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@restaurant/database/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { MenuAvailabilityService } from '../menu/menu-availability.service';
import type {
  AddCartItemDto,
  UpdateCartItemDto,
} from './dto/cart.dto';

const cartInclude = {
  restaurant: { select: { id: true, name: true, slug: true, currency: true } },
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      menuItem: {
        select: {
          id: true,
          name: true,
          status: true,
          media: {
            take: 1,
            orderBy: { sortOrder: 'asc' as const },
            select: { alt: true, media: { select: { url: true } } },
          },
        },
      },
      variantOptions: {
        include: {
          option: { select: { id: true, name: true, variant: { select: { id: true, name: true } } } },
        },
      },
      addOns: { include: { addOn: { select: { id: true, name: true } } } },
    },
  },
} as const;

const fixed = (value: Prisma.Decimal | number) => value.toFixed(2);

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly menuAvailabilityService: MenuAvailabilityService,
  ) {}

  async getOrCreate(userId: string, restaurantId: string) {
    const current = await this.findActive(userId, restaurantId);
    if (current) return this.serialize(current);

    const restaurant = await this.menuAvailabilityService.validateRestaurantAcceptingOrders(
      this.prisma,
      restaurantId,
    );

    try {
      const cart = await this.prisma.cart.create({
        data: { userId, restaurantId, currency: restaurant.currency },
        include: cartInclude,
      });
      return this.serialize(cart);
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        const cart = await this.findActive(userId, restaurantId);
        if (cart) return this.serialize(cart);
      }
      throw error;
    }
  }

  async getCurrent(userId: string, restaurantId: string) {
    if (!restaurantId) throw new BadRequestException('restaurantId is required');
    const cart = await this.findActive(userId, restaurantId);
    return cart ? this.serialize(cart) : null;
  }

  async addItem(userId: string, cartId: string, data: AddCartItemDto) {
    const cart = await this.prisma.$transaction(async (tx) => {
      const owned = await this.getOwned(tx, userId, cartId);
      this.requireVersion(owned.version, data.version);
      const selection = await this.menuAvailabilityService.validateItemSelection(
        tx,
        owned.restaurantId,
        {
          menuItemId: data.menuItemId,
          variantOptionIds: data.variantOptionIds ?? [],
          addOns: data.addOns ?? [],
        },
      );
      const signature = this.signature(data);
      const existing = await tx.cartItem.findUnique({
        where: { cartId_configurationSignature: { cartId, configurationSignature: signature } },
        select: { id: true, quantity: true },
      });
      if (existing) {
        const quantity = existing.quantity + data.quantity;
        if (quantity > 99) throw new BadRequestException('Cart item quantity cannot exceed 99');
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity, totalPrice: selection.unitPrice.mul(quantity) },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId,
            menuItemId: data.menuItemId,
            quantity: data.quantity,
            notes: data.notes?.trim() || null,
            configurationSignature: signature,
            unitPrice: selection.unitPrice,
            totalPrice: selection.unitPrice.mul(data.quantity),
            variantOptions: {
              create: selection.options.map((option) => ({
                optionId: option.id,
                priceAdjustment: option.priceAdjustment,
              })),
            },
            addOns: {
              create: selection.addOns.map((entry) => ({
                addOnId: entry.id,
                quantity: entry.quantity,
                price: entry.price,
              })),
            },
          },
        });
      }
      await this.recalculate(tx, owned, data.version);
      return tx.cart.findUniqueOrThrow({ where: { id: cartId }, include: cartInclude });
    });
    return this.serialize(cart);
  }

  async updateItem(
    userId: string,
    cartId: string,
    cartItemId: string,
    data: UpdateCartItemDto,
  ) {
    if (data.quantity === undefined && data.notes === undefined) {
      throw new BadRequestException('Quantity or notes are required');
    }
    const cart = await this.prisma.$transaction(async (tx) => {
      const owned = await this.getOwned(tx, userId, cartId);
      this.requireVersion(owned.version, data.version);
      const item = await tx.cartItem.findFirst({
        where: { id: cartItemId, cartId },
        include: { variantOptions: true, addOns: true },
      });
      if (!item) throw new NotFoundException('Cart item not found');
      const quantity = data.quantity ?? item.quantity;
      await tx.cartItem.update({
        where: { id: cartItemId },
        data: {
          quantity,
          totalPrice: item.unitPrice.mul(quantity),
          ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
          ...(data.notes !== undefined
            ? {
                configurationSignature: this.signatureOf({
                  menuItemId: item.menuItemId,
                  variantOptionIds: item.variantOptions.map((entry) => entry.optionId),
                  addOns: item.addOns.map((entry) => ({
                    addOnId: entry.addOnId,
                    quantity: entry.quantity,
                  })),
                  notes: data.notes,
                }),
              }
            : {}),
        },
      });
      await this.recalculate(tx, owned, data.version);
      return tx.cart.findUniqueOrThrow({ where: { id: cartId }, include: cartInclude });
    });
    return this.serialize(cart);
  }

  async removeItem(userId: string, cartId: string, cartItemId: string, version: number) {
    const cart = await this.prisma.$transaction(async (tx) => {
      const owned = await this.getOwned(tx, userId, cartId);
      this.requireVersion(owned.version, version);
      const deleted = await tx.cartItem.deleteMany({ where: { id: cartItemId, cartId } });
      if (!deleted.count) throw new NotFoundException('Cart item not found');
      await this.recalculate(tx, owned, version);
      return tx.cart.findUniqueOrThrow({ where: { id: cartId }, include: cartInclude });
    });
    return this.serialize(cart);
  }

  async clear(userId: string, cartId: string) {
    const changed = await this.prisma.cart.updateMany({
      where: { id: cartId, userId, status: 'ACTIVE' },
      data: { status: 'ABANDONED', version: { increment: 1 } },
    });
    if (!changed.count) throw new NotFoundException('Cart not found');
  }

  async revalidate(userId: string, cartId: string, version: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      const owned = await this.getOwned(tx, userId, cartId);
      this.requireVersion(owned.version, version);
      const items = await tx.cartItem.findMany({
        where: { cartId },
        include: { variantOptions: true, addOns: true },
      });
      const changes: Array<{ cartItemId: string; previousUnitPrice: string; unitPrice: string }> = [];
      for (const item of items) {
        const selection = await this.menuAvailabilityService.validateItemSelection(
          tx,
          owned.restaurantId,
          {
            menuItemId: item.menuItemId,
            variantOptionIds: item.variantOptions.map((entry) => entry.optionId),
            addOns: item.addOns.map((entry) => ({ addOnId: entry.addOnId, quantity: entry.quantity })),
          },
        );
        if (!item.unitPrice.equals(selection.unitPrice)) {
          changes.push({
            cartItemId: item.id,
            previousUnitPrice: fixed(item.unitPrice),
            unitPrice: fixed(selection.unitPrice),
          });
          await tx.cartItem.update({
            where: { id: item.id },
            data: {
              unitPrice: selection.unitPrice,
              totalPrice: selection.unitPrice.mul(item.quantity),
            },
          });
        }
      }
      await this.recalculate(tx, owned, version);
      const cart = await tx.cart.findUniqueOrThrow({ where: { id: cartId }, include: cartInclude });
      return { cart, changes };
    });
    return { cart: this.serialize(result.cart), changes: result.changes };
  }

  private findActive(userId: string, restaurantId: string) {
    return this.prisma.cart.findFirst({
      where: { userId, restaurantId, status: 'ACTIVE' },
      include: cartInclude,
    });
  }

  private async getOwned(tx: Prisma.TransactionClient, userId: string, cartId: string) {
    const cart = await tx.cart.findFirst({
      where: {
        id: cartId,
        userId,
        status: 'ACTIVE',
        restaurant: {
          isActive: true,
          status: 'ACTIVE',
          deletedAt: null,
          settings: { acceptsOrders: true },
        },
      },
      select: {
        id: true,
        restaurantId: true,
        version: true,
        restaurant: { select: { settings: { select: { taxRate: true } } } },
      },
    });
    if (!cart) throw new NotFoundException('Active cart not found');
    return cart;
  }


  private async recalculate(
    tx: Prisma.TransactionClient,
    cart: Awaited<ReturnType<CartService['getOwned']>>,
    expectedVersion: number,
  ) {
    const aggregate = await tx.cartItem.aggregate({
      where: { cartId: cart.id },
      _sum: { totalPrice: true },
    });
    const subtotal = aggregate._sum.totalPrice ?? new Prisma.Decimal(0);
    const taxRate = cart.restaurant.settings?.taxRate ?? new Prisma.Decimal(0);
    const tax = subtotal.mul(taxRate).div(100).toDecimalPlaces(2);
    const updated = await tx.cart.updateMany({
      where: { id: cart.id, version: expectedVersion },
      data: {
        subtotal,
        tax,
        discount: 0,
        total: subtotal.plus(tax),
        version: { increment: 1 },
      },
    });
    if (!updated.count) throw new ConflictException('Cart changed in another session; reload it and try again');
  }

  private signature(data: AddCartItemDto) {
    return this.signatureOf(data);
  }

  private signatureOf(data: {
    menuItemId: string;
    variantOptionIds?: string[];
    addOns?: Array<{ addOnId: string; quantity: number }>;
    notes?: string | null;
  }) {
    const canonical = JSON.stringify({
      menuItemId: data.menuItemId,
      variantOptionIds: [...(data.variantOptionIds ?? [])].sort(),
      addOns: [...(data.addOns ?? [])]
        .map((entry) => [entry.addOnId, entry.quantity])
        .sort(([left], [right]) => String(left).localeCompare(String(right))),
      notes: data.notes?.trim() || null,
    });
    return createHash('sha256').update(canonical).digest('hex');
  }

  private requireVersion(actual: number, expected: number) {
    if (actual !== expected) throw new ConflictException('Cart changed in another session; reload it and try again');
  }

  private serialize<T extends { subtotal: Prisma.Decimal; tax: Prisma.Decimal; discount: Prisma.Decimal; total: Prisma.Decimal; items: Array<{ unitPrice: Prisma.Decimal; totalPrice: Prisma.Decimal; variantOptions: Array<{ priceAdjustment: Prisma.Decimal }>; addOns: Array<{ price: Prisma.Decimal }> }> }>(cart: T) {
    return {
      ...cart,
      subtotal: fixed(cart.subtotal),
      tax: fixed(cart.tax),
      discount: fixed(cart.discount),
      total: fixed(cart.total),
      items: cart.items.map((item) => ({
        ...item,
        unitPrice: fixed(item.unitPrice),
        totalPrice: fixed(item.totalPrice),
        variantOptions: item.variantOptions.map((entry) => ({ ...entry, priceAdjustment: fixed(entry.priceAdjustment) })),
        addOns: item.addOns.map((entry) => ({ ...entry, price: fixed(entry.price) })),
      })),
    };
  }

  private isUniqueConflict(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
