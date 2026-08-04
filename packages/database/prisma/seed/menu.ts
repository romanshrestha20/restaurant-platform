import type { PrismaClient } from "../../src/generated";

export type SeededCategories = Record<string, string>;
export type SeededMenuItems = Record<string, string>;

const CATEGORY_DATA = [
  ["Starters", "Small plates and seasonal starters"],
  ["Mains", "Main courses prepared to order"],
  ["Desserts", "House-made desserts"],
  ["Drinks", "Cold and hot drinks"],
] as const;

const MENU_ITEM_DATA = [
  {
    key: "pizza",
    category: "Mains",
    name: "Margherita Pizza",
    sku: "MAIN-PIZZA-MARGHERITA",
    description: "Tomato, mozzarella, basil, and olive oil.",
    basePrice: 12.9,
    preparationTime: 20,
    calories: 780,
    isFeatured: true,
  },
  {
    key: "salad",
    category: "Starters",
    name: "Nordic Caesar Salad",
    sku: "STARTER-CAESAR",
    description: "Crisp greens, rye croutons, parmesan, and house dressing.",
    basePrice: 9.9,
    preparationTime: 10,
    calories: 420,
    isFeatured: false,
  },
  {
    key: "tiramisu",
    category: "Desserts",
    name: "Tiramisu",
    sku: "DESSERT-TIRAMISU",
    description: "Espresso-soaked sponge with mascarpone and cocoa.",
    basePrice: 6.5,
    preparationTime: 5,
    calories: 460,
    isFeatured: true,
  },
  {
    key: "water",
    category: "Drinks",
    name: "Sparkling Water",
    sku: "DRINK-SPARKLING-WATER",
    description: "Chilled sparkling mineral water.",
    basePrice: 3,
    preparationTime: 1,
    calories: 0,
    isFeatured: false,
  },
] as const;

export async function seedCategories(
  prisma: PrismaClient,
  restaurantId: string,
): Promise<SeededCategories> {
  const seeded: SeededCategories = {};

  for (const [index, [name, description]] of CATEGORY_DATA.entries()) {
    const category = await prisma.category.upsert({
      where: { restaurantId_name: { restaurantId, name } },
      update: {
        description,
        sortOrder: index,
        status: "ACTIVE",
        deletedAt: null,
      },
      create: {
        restaurantId,
        name,
        description,
        sortOrder: index,
      },
    });
    seeded[name] = category.id;
  }

  return seeded;
}

export async function seedMenuItems(
  prisma: PrismaClient,
  restaurantId: string,
  categories: SeededCategories,
): Promise<SeededMenuItems> {
  const seeded: SeededMenuItems = {};

  for (const item of MENU_ITEM_DATA) {
    const existing = await prisma.menuItem.findFirst({
      where: { restaurantId, sku: item.sku },
      select: { id: true },
    });

    const data = {
      restaurantId,
      categoryId: categories[item.category],
      name: item.name,
      sku: item.sku,
      description: item.description,
      basePrice: item.basePrice,
      preparationTime: item.preparationTime,
      calories: item.calories,
      isFeatured: item.isFeatured,
      status: "AVAILABLE" as const,
      deletedAt: null,
    };

    const menuItem = existing
      ? await prisma.menuItem.update({ where: { id: existing.id }, data })
      : await prisma.menuItem.create({ data });

    seeded[item.key] = menuItem.id;
  }

  return seeded;
}

export async function seedVariants(
  prisma: PrismaClient,
  menuItems: SeededMenuItems,
) {
  const pizzaId = menuItems.pizza;
  const existing = await prisma.variant.findFirst({
    where: { menuItemId: pizzaId, name: "Size" },
  });
  const variant = existing
    ? await prisma.variant.update({
        where: { id: existing.id },
        data: { sortOrder: 0 },
      })
    : await prisma.variant.create({
        data: { menuItemId: pizzaId, name: "Size", sortOrder: 0 },
      });

  const options = [
    ["Small", 0],
    ["Medium", 2],
    ["Large", 4],
  ] as const;

  for (const [name, price] of options) {
    const option = await prisma.variantOption.findFirst({
      where: { variantId: variant.id, name },
    });
    if (option) {
      await prisma.variantOption.update({
        where: { id: option.id },
        data: { price },
      });
    } else {
      await prisma.variantOption.create({
        data: { variantId: variant.id, name, price },
      });
    }
  }
}

export async function seedAddOns(
  prisma: PrismaClient,
  restaurantId: string,
  menuItems: SeededMenuItems,
) {
  const existingGroup = await prisma.addOnGroup.findFirst({
    where: { restaurantId, name: "Pizza Extras" },
  });
  const group = existingGroup
    ? await prisma.addOnGroup.update({
        where: { id: existingGroup.id },
        data: { required: false, minSelection: 0, maxSelection: 3 },
      })
    : await prisma.addOnGroup.create({
        data: {
          restaurantId,
          name: "Pizza Extras",
          required: false,
          minSelection: 0,
          maxSelection: 3,
        },
      });

  for (const [name, price] of [
    ["Extra cheese", 1.5],
    ["Mushrooms", 1],
    ["Jalapeños", 0.75],
  ] as const) {
    const addOn = await prisma.addOn.findFirst({
      where: { groupId: group.id, name },
    });
    if (addOn) {
      await prisma.addOn.update({
        where: { id: addOn.id },
        data: { price, isAvailable: true },
      });
    } else {
      await prisma.addOn.create({
        data: { groupId: group.id, name, price },
      });
    }
  }

  await prisma.menuItemAddOnGroup.upsert({
    where: {
      menuItemId_groupId: { menuItemId: menuItems.pizza, groupId: group.id },
    },
    update: {},
    create: { menuItemId: menuItems.pizza, groupId: group.id },
  });
}

export async function seedCoupons(prisma: PrismaClient) {
  const coupons = [
    {
      code: "WELCOME10",
      name: "Welcome discount",
      description: "Ten percent off a customer's first order.",
      type: "PERCENTAGE" as const,
      value: 10,
      minimumOrder: 20,
      maximumDiscount: 15,
    },
    {
      code: "LUNCH5",
      name: "Lunch discount",
      description: "Five euros off qualifying lunch orders.",
      type: "FIXED_AMOUNT" as const,
      value: 5,
      minimumOrder: 25,
      maximumDiscount: null,
    },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: { ...coupon, isActive: true, deletedAt: null },
      create: coupon,
    });
  }
}
