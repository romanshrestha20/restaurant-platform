import { hash } from "bcrypt";
import type { PrismaClient } from "../../src/generated";

const DEFAULT_CUSTOMER_EMAIL = "customer@restaurant.local";

export async function seedCustomer(prisma: PrismaClient) {
  const email = (process.env.SEED_CUSTOMER_EMAIL ?? DEFAULT_CUSTOMER_EMAIL)
    .trim()
    .toLowerCase();
  const password =
    (process.env.SEED_CUSTOMER_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD) ||
    "Password123@";

  if (!password || password.length < 12) {
    throw new Error(
      "SEED_CUSTOMER_PASSWORD or SEED_ADMIN_PASSWORD must be set and contain at least 12 characters.",
    );
  }

  const passwordHash = await hash(password, 12);
  const customer = await prisma.user.upsert({
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

  await prisma.profile.upsert({
    where: { userId: customer.id },
    update: { firstName: "Test", lastName: "Customer" },
    create: {
      userId: customer.id,
      firstName: "Test",
      lastName: "Customer",
      bio: "Seeded customer account for ordering tests",
    },
  });

  return customer;
}
