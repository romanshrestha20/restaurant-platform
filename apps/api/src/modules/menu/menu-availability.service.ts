import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@restaurant/database/generated';
import { PrismaService } from '../../prisma/prisma.service';

export interface ValidatedVariantOption {
  id: string;
  name: string;
  priceAdjustment: Prisma.Decimal;
  variantId: string;
  variantName: string;
}

export interface ValidatedAddOn {
  id: string;
  name: string;
  price: Prisma.Decimal;
  quantity: number;
  groupId: string;
  groupName: string;
}

export interface ValidatedItemSelection {
  item: {
    id: string;
    name: string;
    basePrice: Prisma.Decimal;
    categoryId: string;
  };
  unitPrice: Prisma.Decimal;
  options: ValidatedVariantOption[];
  addOns: ValidatedAddOn[];
}

export interface ItemSelectionInput {
  menuItemId: string;
  variantOptionIds?: string[];
  addOns?: Array<{ addOnId: string; quantity: number }>;
}

export interface CartItemLike {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
  variantOptions: Array<{ optionId: string; option?: { id: string; name: string } }>;
  addOns: Array<{ addOnId: string; quantity: number; addOn?: { id: string; name: string } }>;
  menuItem?: { name: string };
}

@Injectable()
export class MenuAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates that a restaurant exists, is active, and is currently accepting orders.
   */
  async validateRestaurantAcceptingOrders(
    client: Prisma.TransactionClient | PrismaService,
    restaurantId: string,
  ) {
    const db = client ?? this.prisma;
    const restaurant = await db.restaurant.findFirst({
      where: {
        id: restaurantId,
        isActive: true,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        currency: true,
        settings: {
          select: {
            acceptsOrders: true,
            taxRate: true,
            minimumOrder: true,
            deliveryFee: true,
            deliveryRadiusKm: true,
            serviceFee: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new ConflictException('Restaurant is inactive or not found');
    }

    if (restaurant.settings && !restaurant.settings.acceptsOrders) {
      throw new ConflictException('Restaurant is not currently accepting orders');
    }

    return restaurant;
  }

  /**
   * Authoritatively validates item availability, variant options, add-ons, and calculates the canonical unit price.
   */
  async validateItemSelection(
    client: Prisma.TransactionClient | PrismaService,
    restaurantId: string,
    input: ItemSelectionInput,
  ): Promise<ValidatedItemSelection> {
    const optionIds = input.variantOptionIds ?? [];
    const addOnInput = input.addOns ?? [];

    if (new Set(addOnInput.map((entry) => entry.addOnId)).size !== addOnInput.length) {
      throw new BadRequestException('Each add-on may only be selected once per item');
    }

    for (const addon of addOnInput) {
      if (addon.quantity < 1 || !Number.isInteger(addon.quantity)) {
        throw new BadRequestException('Add-on quantity must be a positive integer');
      }
    }

    const item = await client.menuItem.findFirst({
      where: {
        id: input.menuItemId,
        restaurantId,
        status: 'AVAILABLE',
        deletedAt: null,
        category: {
          status: 'ACTIVE',
          deletedAt: null,
          menu: {
            isActive: true,
            deletedAt: null,
            restaurant: {
              isActive: true,
              status: 'ACTIVE',
              deletedAt: null,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        basePrice: true,
        categoryId: true,
        variants: {
          select: {
            id: true,
            name: true,
            options: {
              select: {
                id: true,
                name: true,
                priceAdjustment: true,
              },
            },
          },
        },
        addOnGroups: {
          select: {
            group: {
              select: {
                id: true,
                name: true,
                required: true,
                minSelection: true,
                maxSelection: true,
                addOns: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    isAvailable: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new ConflictException('Menu item is unavailable or no longer exists');
    }

    // Validate Variants and Options
    const selectedOptions: ValidatedVariantOption[] = [];
    const requestedOptionSet = new Set(optionIds);

    for (const variant of item.variants) {
      const variantSelectedOptions = variant.options.filter((opt) =>
        requestedOptionSet.has(opt.id),
      );

      if (variantSelectedOptions.length > 1) {
        throw new BadRequestException(
          `Select at most one option from variant "${variant.name}"`,
        );
      }

      for (const opt of variantSelectedOptions) {
        selectedOptions.push({
          id: opt.id,
          name: opt.name,
          priceAdjustment: opt.priceAdjustment,
          variantId: variant.id,
          variantName: variant.name,
        });
        requestedOptionSet.delete(opt.id);
      }
    }

    if (requestedOptionSet.size > 0) {
      throw new BadRequestException('A selected variant option does not belong to this item');
    }

    // Validate Add-on Groups and Add-ons
    const selectedAddOns: ValidatedAddOn[] = [];
    const requestedAddOnMap = new Map(
      addOnInput.map((entry) => [entry.addOnId, entry.quantity]),
    );

    for (const { group } of item.addOnGroups) {
      let groupSelectedTotalCount = 0;

      for (const addOn of group.addOns) {
        const qty = requestedAddOnMap.get(addOn.id);
        if (qty !== undefined) {
          if (!addOn.isAvailable) {
            throw new ConflictException(
              `Add-on "${addOn.name}" is currently out of stock`,
            );
          }
          selectedAddOns.push({
            id: addOn.id,
            name: addOn.name,
            price: addOn.price,
            quantity: qty,
            groupId: group.id,
            groupName: group.name,
          });
          groupSelectedTotalCount += qty;
          requestedAddOnMap.delete(addOn.id);
        }
      }

      const effectiveMin = group.required && group.minSelection === 0 ? 1 : group.minSelection;
      if (groupSelectedTotalCount < effectiveMin || groupSelectedTotalCount > group.maxSelection) {
        throw new BadRequestException(
          `${group.required ? 'Required add-on group' : 'Add-on group'} "${group.name}" selections must be between ${effectiveMin} and ${group.maxSelection}`,
        );
      }
    }

    if (requestedAddOnMap.size > 0) {
      throw new BadRequestException('A selected add-on is unavailable for this item');
    }

    // Calculate canonical unit price
    const variantPriceSum = selectedOptions.reduce(
      (sum, opt) => sum.plus(opt.priceAdjustment),
      new Prisma.Decimal(0),
    );

    const addOnPriceSum = selectedAddOns.reduce(
      (sum, addOn) => sum.plus(addOn.price.mul(addOn.quantity)),
      new Prisma.Decimal(0),
    );

    const unitPrice = item.basePrice.plus(variantPriceSum).plus(addOnPriceSum);

    return {
      item: {
        id: item.id,
        name: item.name,
        basePrice: item.basePrice,
        categoryId: item.categoryId,
      },
      unitPrice,
      options: selectedOptions,
      addOns: selectedAddOns,
    };
  }

  /**
   * Validates all cart items during checkout, verifying that items remain available and prices match.
   */
  async validateCartItems(
    client: Prisma.TransactionClient | PrismaService,
    restaurantId: string,
    items: CartItemLike[],
  ) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Cart has no items to validate');
    }

    const validatedItems: Array<{
      cartItem: CartItemLike;
      validated: ValidatedItemSelection;
    }> = [];

    for (const item of items) {
      const optionIds = item.variantOptions.map((vo) => vo.optionId);
      const addOns = item.addOns.map((ao) => ({
        addOnId: ao.addOnId,
        quantity: ao.quantity,
      }));

      const validated = await this.validateItemSelection(client, restaurantId, {
        menuItemId: item.menuItemId,
        variantOptionIds: optionIds,
        addOns,
      });

      // Price parity check
      if (!item.unitPrice.equals(validated.unitPrice)) {
        const itemName = item.menuItem?.name || validated.item.name;
        throw new ConflictException(
          `Price for "${itemName}" has changed from €${item.unitPrice.toFixed(2)} to €${validated.unitPrice.toFixed(2)}. Please refresh your cart.`,
        );
      }

      validatedItems.push({ cartItem: item, validated });
    }

    return validatedItems;
  }
}
