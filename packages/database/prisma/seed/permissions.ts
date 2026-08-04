import type { PrismaClient } from "../../src/generated";

const PERMISSIONS = [
  ["activity.read", "View activity and audit logs"],
  ["users.manage", "Manage platform users"],
  ["restaurants.manage", "Manage restaurant details and settings"],
  ["members.manage", "Manage restaurant members and their roles"],
  ["menu.manage", "Manage categories, menu items, variants, and add-ons"],
  ["orders.manage", "Manage restaurant orders"],
  ["payments.manage", "Manage payments and refunds"],
  ["reservations.manage", "Manage reservations and tables"],
  ["reviews.manage", "Moderate customer reviews"],
  ["coupons.manage", "Manage coupons and promotions"],
] as const;

export type PermissionName = (typeof PERMISSIONS)[number][0];
export type SeededPermissions = Record<PermissionName, string>;

export async function seedPermissions(
  prisma: PrismaClient,
): Promise<SeededPermissions> {
  const seeded = {} as SeededPermissions;

  for (const [name, description] of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { name },
      update: { description },
      create: { name, description },
    });
    seeded[name] = permission.id;
  }

  return seeded;
}
