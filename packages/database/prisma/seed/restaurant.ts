import type { PrismaClient } from "../../src/generated";

const RESTAURANT_SLUG = "nordic-table-helsinki";

export async function seedRestaurant(prisma: PrismaClient) {
  return prisma.restaurant.upsert({
    where: { slug: RESTAURANT_SLUG },
    update: {
      name: "Nordic Table",
      isActive: true,
      status: "ACTIVE",
      deletedAt: null,
    },
    create: {
      name: "Nordic Table",
      slug: RESTAURANT_SLUG,
      description: "Seasonal Nordic cooking in central Helsinki.",
      email: "hello@nordictable.local",
      phone: "+358 9 123 4567",
      currency: "EUR",
      timezone: "Europe/Helsinki",
    },
  });
}

const RESTAURANT_ADDRESS_ID = "seed-nordic-table-primary-address";

export async function seedRestaurantAddress(
  prisma: PrismaClient,
  restaurantId: string,
) {
  const address = {
    restaurantId,
    label: "Primary",
    street: "Aleksanterinkatu 12",
    city: "Helsinki",
    state: null,
    postalCode: "00100",
    country: "FI",
    latitude: null,
    longitude: null,
    isPrimary: true,
  };

  return prisma.restaurantAddress.upsert({
    where: { id: RESTAURANT_ADDRESS_ID },
    update: address,
    create: { id: RESTAURANT_ADDRESS_ID, ...address },
  });
}

export async function seedRestaurantSettings(
  prisma: PrismaClient,
  restaurantId: string,
) {
  return prisma.restaurantSettings.upsert({
    where: { restaurantId },
    update: {
      acceptsOrders: true,
      acceptsReservations: true,
      estimatedPrepMinutes: 30,
      minimumOrder: 15,
      deliveryFee: 4.9,
      serviceFee: 0,
      taxRate: 14,
    },
    create: {
      restaurantId,
      acceptsOrders: true,
      acceptsReservations: true,
      autoAcceptOrders: false,
      estimatedPrepMinutes: 30,
      minimumOrder: 15,
      deliveryFee: 4.9,
      serviceFee: 0,
      taxRate: 14,
    },
  });
}

export async function seedRestaurantMember(
  prisma: PrismaClient,
  restaurantId: string,
  userId: string,
  roleId: string,
) {
  return prisma.restaurantMember.upsert({
    where: { restaurantId_userId: { restaurantId, userId } },
    update: { roleId },
    create: { restaurantId, userId, roleId },
  });
}
