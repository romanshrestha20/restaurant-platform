import type { PrismaClient } from "../../src/generated";
import {
  ROLE_DESCRIPTIONS,
  ROLE_NAMES,
  type RoleName,
} from "../../src/authorization.cjs";
import type {
  PermissionName,
  SeededPermissions,
} from "./permissions";

export type SeededRoles = Record<RoleName, string>;

const ALL_PERMISSIONS: PermissionName[] = [
  "activity.read",
  "users.manage",
  "restaurants.manage",
  "members.manage",
  "menu.manage",
  "orders.manage",
  "payments.manage",
  "reservations.manage",
  "reviews.manage",
  "coupons.manage",
];

const ROLE_PERMISSIONS: Record<RoleName, PermissionName[]> = {
  ADMIN: ALL_PERMISSIONS,
  OWNER: ALL_PERMISSIONS.filter((permission) => permission !== "users.manage"),
  MANAGER: [
    "activity.read",
    "restaurants.manage",
    "members.manage",
    "menu.manage",
    "orders.manage",
    "payments.manage",
    "reservations.manage",
    "reviews.manage",
    "coupons.manage",
  ],
  CHEF: ["menu.manage", "orders.manage"],
  WAITER: ["orders.manage", "reservations.manage"],
  CUSTOMER: [],
};

export async function seedRoles(prisma: PrismaClient): Promise<SeededRoles> {
  const seeded = {} as SeededRoles;

  for (const name of ROLE_NAMES) {
    const description = ROLE_DESCRIPTIONS[name];
    const role = await prisma.role.upsert({
      where: { name },
      update: { description },
      create: { name, description },
    });
    seeded[name] = role.id;
  }

  return seeded;
}

export async function seedRolePermissions(
  prisma: PrismaClient,
  roles: SeededRoles,
  permissions: SeededPermissions,
) {
  for (const [roleName, permissionNames] of Object.entries(
    ROLE_PERMISSIONS,
  ) as [RoleName, PermissionName[]][]) {
    for (const permissionName of permissionNames) {
      const roleId = roles[roleName];
      const permissionId = permissions[permissionName];

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }
}
