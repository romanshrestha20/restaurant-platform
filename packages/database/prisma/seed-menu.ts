import prisma from "../src/client";
import {
  seedAddOns,
  seedCategories,
  seedMenuItems,
  seedVariants,
} from "./seed/menu";

const DEFAULT_RESTAURANT = "nordic-table-helsinki";

async function main() {
  const restaurantIdentifier = process.argv[2] ?? DEFAULT_RESTAURANT;
  const restaurants = await prisma.restaurant.findMany({
    where: {
      OR: [
        { slug: restaurantIdentifier },
        { name: { equals: restaurantIdentifier, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true },
    take: 2,
  });

  if (restaurants.length === 0) {
    throw new Error(
      `Restaurant "${restaurantIdentifier}" does not exist. Create it before seeding its menu.`,
    );
  }
  if (restaurants.length > 1) {
    throw new Error(
      `Restaurant "${restaurantIdentifier}" is ambiguous. Use its unique slug instead.`,
    );
  }

  const [restaurant] = restaurants;

  console.log(`Seeding menu for ${restaurant.name}...`);
  const categories = await seedCategories(prisma, restaurant.id);
  const menuItems = await seedMenuItems(prisma, restaurant.id, categories);
  await seedVariants(prisma, menuItems);
  await seedAddOns(prisma, restaurant.id, menuItems);

  const [
    menuCount,
    categoryCount,
    itemCount,
    variantCount,
    optionCount,
    addOnGroupCount,
    addOnCount,
  ] = await Promise.all([
      prisma.menu.count({
        where: { restaurantId: restaurant.id, deletedAt: null },
      }),
      prisma.category.count({
        where: { restaurantId: restaurant.id, deletedAt: null },
      }),
      prisma.menuItem.count({
        where: { restaurantId: restaurant.id, deletedAt: null },
      }),
      prisma.variant.count({
        where: { menuItem: { restaurantId: restaurant.id } },
      }),
      prisma.variantOption.count({
        where: { variant: { menuItem: { restaurantId: restaurant.id } } },
      }),
      prisma.addOnGroup.count({ where: { restaurantId: restaurant.id } }),
      prisma.addOn.count({
        where: { group: { restaurantId: restaurant.id } },
      }),
    ]);

  console.log(
    `Menu seed completed: ${menuCount} menu, ${categoryCount} categories, ${itemCount} items, ${variantCount} variant, ${optionCount} variant options, ${addOnGroupCount} add-on group, ${addOnCount} add-ons.`,
  );
}

main()
  .catch((error) => {
    console.error("Menu seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
