import type { PrismaClient } from "../../src/generated";

const PERMISSIONS = [
  ["restaurant.read", "View restaurants"],
  ["restaurant.create", "Create restaurants"],
  ["restaurant.update", "Update restaurants"],
  ["restaurant.delete", "Delete restaurants"],
  ["order.read", "View orders"],
  ["order.update", "Update orders"],
  ["order.refund", "Refund orders"],
  ["customer.read", "View customers"],
  ["customer.update", "Update customers"],
  ["customer.suspend", "Suspend customers"],
  ["menu.read", "View menus"],
  ["menu.create", "Create menus"],
  ["menu.update", "Update menus"],
  ["menu.delete", "Delete menus"],
  ["staff.read", "View staff"],
  ["staff.invite", "Invite staff"],
  ["staff.update", "Update staff"],
  ["staff.remove", "Remove staff"],
  ["report.read", "View reports"],
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
