import type { PrismaClient } from "../../src/generated";

const TABLES = [
  ["1", 2],
  ["2", 2],
  ["3", 4],
  ["4", 4],
  ["5", 4],
  ["6", 6],
  ["7", 6],
  ["8", 8],
] as const;

export async function seedRestaurantTables(
  prisma: PrismaClient,
  restaurantId: string,
) {
  for (const [tableNumber, capacity] of TABLES) {
    await prisma.restaurantTable.upsert({
      where: { restaurantId_tableNumber: { restaurantId, tableNumber } },
      update: { capacity, status: "AVAILABLE" },
      create: { restaurantId, tableNumber, capacity },
    });
  }
}
