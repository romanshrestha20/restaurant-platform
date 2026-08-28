import prisma from "../../src/client";
import { CURATED_CATALOGS } from "../../../../apps/web/src/modules/order/data/curated-catalogs";
import type { CustomerCatalog } from "../../../../apps/web/src/modules/order/types/customer-order.types";

/** Seeds the customer-facing catalog used by the web app into the real menu tables. */
export async function seedCuratedCatalog(catalog: CustomerCatalog) {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: catalog.slug },
    update: { name: catalog.name, description: catalog.description, currency: catalog.currency, timezone: catalog.timezone, isActive: true, status: "ACTIVE", deletedAt: null },
    create: { name: catalog.name, slug: catalog.slug, description: catalog.description, currency: catalog.currency, timezone: catalog.timezone },
  });

  await prisma.restaurantSettings.upsert({
    where: { restaurantId: restaurant.id },
    update: { estimatedPrepMinutes: catalog.settings?.estimatedPrepMinutes ?? 30, minimumOrder: Number(catalog.settings?.minimumOrder ?? 0), deliveryFee: Number(catalog.settings?.deliveryFee ?? 0), serviceFee: Number(catalog.settings?.serviceFee ?? 0), taxRate: Number(catalog.settings?.taxRate ?? 14), acceptsOrders: true },
    create: { restaurantId: restaurant.id, estimatedPrepMinutes: catalog.settings?.estimatedPrepMinutes ?? 30, minimumOrder: Number(catalog.settings?.minimumOrder ?? 0), deliveryFee: Number(catalog.settings?.deliveryFee ?? 0), serviceFee: Number(catalog.settings?.serviceFee ?? 0), taxRate: Number(catalog.settings?.taxRate ?? 14) },
  });

  for (const [menuIndex, menuData] of catalog.menus.entries()) {
    const menu = await prisma.menu.upsert({ where: { id: menuData.id }, update: { restaurantId: restaurant.id, name: menuData.name, description: menuData.description, sortOrder: menuIndex, isActive: true, deletedAt: null }, create: { id: menuData.id, restaurantId: restaurant.id, name: menuData.name, description: menuData.description, sortOrder: menuIndex } });
    for (const [categoryIndex, categoryData] of menuData.categories.entries()) {
      const category = await prisma.category.upsert({ where: { id: categoryData.id }, update: { restaurantId: restaurant.id, menuId: menu.id, name: categoryData.name, description: categoryData.description, sortOrder: categoryIndex, status: "ACTIVE", deletedAt: null }, create: { id: categoryData.id, restaurantId: restaurant.id, menuId: menu.id, name: categoryData.name, description: categoryData.description, sortOrder: categoryIndex } });
      for (const [itemIndex, itemData] of categoryData.items.entries()) {
        const item = await prisma.menuItem.upsert({ where: { id: itemData.id }, update: { restaurantId: restaurant.id, categoryId: category.id, name: itemData.name, description: itemData.description, basePrice: Number(itemData.basePrice), preparationTime: itemData.preparationTime, calories: itemData.calories, isFeatured: itemData.isFeatured, sortOrder: itemIndex, status: "AVAILABLE", deletedAt: null }, create: { id: itemData.id, restaurantId: restaurant.id, categoryId: category.id, name: itemData.name, description: itemData.description, basePrice: Number(itemData.basePrice), preparationTime: itemData.preparationTime, calories: itemData.calories, isFeatured: itemData.isFeatured, sortOrder: itemIndex } });
        for (const [variantIndex, variantData] of itemData.variants.entries()) {
          const variant = await prisma.variant.upsert({ where: { id: variantData.id }, update: { menuItemId: item.id, name: variantData.name, sortOrder: variantIndex }, create: { id: variantData.id, menuItemId: item.id, name: variantData.name, sortOrder: variantIndex } });
          for (const [optionIndex, optionData] of variantData.options.entries()) await prisma.variantOption.upsert({ where: { id: optionData.id }, update: { variantId: variant.id, name: optionData.name, priceAdjustment: Number(optionData.priceAdjustment) }, create: { id: optionData.id, variantId: variant.id, name: optionData.name, priceAdjustment: Number(optionData.priceAdjustment) } });
        }
        for (const [groupIndex, groupData] of itemData.addOnGroups.entries()) {
          const group = await prisma.addOnGroup.upsert({ where: { id: groupData.id }, update: { restaurantId: restaurant.id, name: groupData.name, required: groupData.required, minSelection: groupData.minSelection, maxSelection: groupData.maxSelection }, create: { id: groupData.id, restaurantId: restaurant.id, name: groupData.name, required: groupData.required, minSelection: groupData.minSelection, maxSelection: groupData.maxSelection } });
          await prisma.menuItemAddOnGroup.upsert({ where: { menuItemId_groupId: { menuItemId: item.id, groupId: group.id } }, update: {}, create: { menuItemId: item.id, groupId: group.id } });
          for (const [addOnIndex, addOnData] of groupData.addOns.entries()) await prisma.addOn.upsert({ where: { id: addOnData.id }, update: { groupId: group.id, name: addOnData.name, price: Number(addOnData.price), sortOrder: addOnIndex, isAvailable: true }, create: { id: addOnData.id, groupId: group.id, name: addOnData.name, price: Number(addOnData.price), sortOrder: addOnIndex } });
          void groupIndex;
        }
        for (const [mediaIndex, mediaData] of itemData.media.entries()) {
          const mediaId = `${item.id}-media-${mediaIndex}`;
          const media = await prisma.media.upsert({ where: { publicId: mediaId }, update: { url: mediaData.media.url, fileName: mediaData.alt }, create: { id: mediaId, publicId: mediaId, url: mediaData.media.url, fileName: mediaData.alt, width: mediaData.media.width, height: mediaData.media.height } });
          await prisma.menuItemMedia.upsert({ where: { menuItemId_mediaId: { menuItemId: item.id, mediaId: media.id } }, update: { alt: mediaData.alt, sortOrder: mediaIndex }, create: { menuItemId: item.id, mediaId: media.id, alt: mediaData.alt, sortOrder: mediaIndex } });
        }
      }
    }
  }
  return restaurant;
}

async function main() {
  for (const catalog of Object.values(CURATED_CATALOGS)) {
    const restaurant = await seedCuratedCatalog(catalog);
    const count = await prisma.menuItem.count({ where: { restaurantId: restaurant.id, deletedAt: null } });
    console.log(`${restaurant.name}: ${count} dishes`);
  }
}

if (process.argv[1]?.endsWith("seed/catalog.ts")) main().finally(() => prisma.$disconnect());
