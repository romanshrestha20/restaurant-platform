import { hash } from "bcrypt";
import type { PrismaClient } from "../../src/generated";

const DEFAULT_ADMIN_EMAIL = "admin@restaurant.local";

export async function seedAdmin(prisma: PrismaClient, adminRoleId: string) {
  const email = (process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL)
    .trim()
    .toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must be set and contain at least 12 characters.",
    );
  }
  const passwordHash = await hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      emailVerified: true,
      isActive: true,
      deletedAt: null,
    },
    create: {
      email,
      passwordHash,
      emailVerified: true,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRoleId } },
    update: {},
    create: { userId: admin.id, roleId: adminRoleId },
  });

  return admin;
}

export async function seedAdminProfile(prisma: PrismaClient, userId: string) {
  return prisma.profile.upsert({
    where: { userId },
    update: { firstName: "Platform", lastName: "Admin" },
    create: {
      userId,
      firstName: "Platform",
      lastName: "Admin",
      bio: "Seeded platform administrator",
    },
  });
}
