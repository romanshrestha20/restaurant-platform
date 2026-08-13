import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@restaurant/database/generated';
import type { PrismaService } from '../../prisma/prisma.service';
import { CartService } from './cart.service';

describe('CartService pricing', () => {
  const findMenuItem = jest.fn();
  const service = new CartService({} as PrismaService);
  const tx = { menuItem: { findFirst: findMenuItem } } as unknown as Prisma.TransactionClient;

  beforeEach(() => jest.clearAllMocks());

  it('calculates server-authoritative base, variant, and add-on pricing', async () => {
    findMenuItem.mockResolvedValue({
      basePrice: new Prisma.Decimal('10.00'),
      variants: [
        { id: 'size', options: [{ id: 'large', priceAdjustment: new Prisma.Decimal('2.50') }] },
      ],
      addOnGroups: [
        {
          group: {
            id: 'extras', required: false, minSelection: 0, maxSelection: 2,
            addOns: [{ id: 'cheese', price: new Prisma.Decimal('1.25') }],
          },
        },
      ],
    });

    const selection = await service['resolveSelection'](
      tx,
      'restaurant-1',
      'item-1',
      ['large'],
      [{ addOnId: 'cheese', quantity: 2 }],
    );

    expect(selection.unitPrice.toFixed(2)).toBe('15.00');
    expect(findMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ restaurantId: 'restaurant-1', status: 'AVAILABLE' }),
      }),
    );
  });

  it('rejects options that do not belong to the selected item', async () => {
    findMenuItem.mockResolvedValue({
      basePrice: new Prisma.Decimal('10'),
      variants: [],
      addOnGroups: [],
    });
    await expect(
      service['resolveSelection'](tx, 'restaurant-1', 'item-1', ['foreign-option'], []),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces required add-on selection limits', async () => {
    findMenuItem.mockResolvedValue({
      basePrice: new Prisma.Decimal('10'),
      variants: [],
      addOnGroups: [
        { group: { id: 'required', required: true, minSelection: 1, maxSelection: 1, addOns: [] } },
      ],
    });
    await expect(
      service['resolveSelection'](tx, 'restaurant-1', 'item-1', [], []),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects menu items that are unavailable', async () => {
    findMenuItem.mockResolvedValue(null);
    await expect(
      service['resolveSelection'](tx, 'restaurant-1', 'item-1', [], []),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
