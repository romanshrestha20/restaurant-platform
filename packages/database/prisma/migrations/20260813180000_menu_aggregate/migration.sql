-- Add the restaurant-scoped menu aggregate while preserving existing categories.
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "menus_restaurantId_name_key" ON "menus"("restaurantId", "name");
CREATE INDEX "menus_restaurantId_sortOrder_idx" ON "menus"("restaurantId", "sortOrder");
CREATE INDEX "menus_deletedAt_idx" ON "menus"("deletedAt");

ALTER TABLE "menus"
ADD CONSTRAINT "menus_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "menus" ("id", "restaurantId", "name", "description", "sortOrder", "isActive", "deletedAt")
SELECT
  'menu_' || md5("id"),
  "id",
  'Main menu',
  'Default restaurant menu',
  0,
  "deletedAt" IS NULL,
  "deletedAt"
FROM "restaurants";

ALTER TABLE "categories" ADD COLUMN "menuId" TEXT;

UPDATE "categories" AS category
SET "menuId" = menu."id"
FROM "menus" AS menu
WHERE menu."restaurantId" = category."restaurantId";

ALTER TABLE "categories" ALTER COLUMN "menuId" SET NOT NULL;
DROP INDEX "categories_restaurantId_name_key";
CREATE UNIQUE INDEX "categories_menuId_name_key" ON "categories"("menuId", "name");
CREATE INDEX "categories_restaurantId_idx" ON "categories"("restaurantId");
CREATE INDEX "categories_menuId_sortOrder_idx" ON "categories"("menuId", "sortOrder");

ALTER TABLE "categories"
ADD CONSTRAINT "categories_menuId_fkey"
FOREIGN KEY ("menuId") REFERENCES "menus"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "menu_items" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Menu item lookup and ordering indexes. PostgreSQL permits multiple NULL
-- values in this unique index, so SKU remains optional.
CREATE UNIQUE INDEX "menu_items_restaurantId_sku_key" ON "menu_items"("restaurantId", "sku");
CREATE INDEX "menu_items_restaurantId_status_idx" ON "menu_items"("restaurantId", "status");
CREATE INDEX "menu_items_categoryId_status_idx" ON "menu_items"("categoryId", "status");
CREATE INDEX "menu_items_categoryId_sortOrder_idx" ON "menu_items"("categoryId", "sortOrder");

-- Variant option prices are adjustments to the menu item's base price.
ALTER TABLE "variant_options" RENAME COLUMN "price" TO "priceAdjustment";

-- Add-ons have stable ordering within a group.
ALTER TABLE "addons" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "addons_groupId_sortOrder_idx" ON "addons"("groupId", "sortOrder");
CREATE INDEX "addon_groups_restaurantId_idx" ON "addon_groups"("restaurantId");

-- Selection limits are domain invariants and are also protected at rest.
ALTER TABLE "addon_groups"
ADD CONSTRAINT "addon_groups_selection_limits_check"
CHECK (
  "minSelection" >= 0
  AND "maxSelection" >= 1
  AND "maxSelection" >= "minSelection"
);

-- Dietary tags are intentionally deferred until the product uses them.
DROP TYPE IF EXISTS "DietaryType";
