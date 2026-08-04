import prisma from "../src/client";
import { seedAdmin, seedAdminProfile } from "./seed/admin";
import {
  seedAddOns,
  seedCategories,
  seedCoupons,
  seedMenuItems,
  seedVariants,
} from "./seed/menu";
import { seedPermissions } from "./seed/permissions";
import {
  seedRestaurant,
  seedRestaurantMember,
  seedRestaurantSettings,
} from "./seed/restaurant";
import { seedRolePermissions, seedRoles } from "./seed/roles";
import { seedRestaurantTables } from "./seed/tables";



async function main() {
  console.log("Seeding permissions...");
  const permissions = await seedPermissions(prisma);

  console.log("Seeding roles...");
  const roles = await seedRoles(prisma);

  console.log("Seeding role permissions...");
  await seedRolePermissions(prisma, roles, permissions);

  console.log("Seeding admin user...");
  const admin = await seedAdmin(prisma, roles.ADMIN);

  console.log("Seeding admin profile...");
  await seedAdminProfile(prisma, admin.id);

  console.log("Seeding restaurant...");
  const restaurant = await seedRestaurant(prisma);

  console.log("Seeding restaurant settings...");
  await seedRestaurantSettings(prisma, restaurant.id);

  console.log("Seeding restaurant member...");
  await seedRestaurantMember(prisma, restaurant.id, admin.id, roles.OWNER);

  console.log("Seeding categories...");
  const categories = await seedCategories(prisma, restaurant.id);

  console.log("Seeding menu items...");
  const menuItems = await seedMenuItems(prisma, restaurant.id, categories);

  console.log("Seeding variants...");
  await seedVariants(prisma, menuItems);

  console.log("Seeding add-ons...");
  await seedAddOns(prisma, restaurant.id, menuItems);

  console.log("Seeding restaurant tables...");
  await seedRestaurantTables(prisma, restaurant.id);

  console.log("Seeding coupons...");
  await seedCoupons(prisma);

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
