-- Customer cart V1: persistent totals, optimistic concurrency, and multi-variant selections.
ALTER TABLE "carts"
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE INDEX "carts_userId_restaurantId_status_idx"
ON "carts"("userId", "restaurantId", "status");

-- PostgreSQL partial uniqueness guarantees one active cart while retaining history.
WITH ranked_active_carts AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "userId", "restaurantId"
    ORDER BY "updatedAt" DESC, "createdAt" DESC
  ) AS position
  FROM "carts"
  WHERE "status" = 'ACTIVE'
)
UPDATE "carts"
SET "status" = 'ABANDONED'
FROM ranked_active_carts
WHERE "carts"."id" = ranked_active_carts."id"
  AND ranked_active_carts.position > 1;

CREATE UNIQUE INDEX "carts_one_active_per_customer_restaurant"
ON "carts"("userId", "restaurantId")
WHERE "status" = 'ACTIVE';

ALTER TABLE "cart_items"
ADD COLUMN "notes" TEXT,
ADD COLUMN "configurationSignature" TEXT;

UPDATE "cart_items"
SET "configurationSignature" = md5(
  "menuItemId" || ':' || COALESCE("variantId", '') || ':' || "id"
);

ALTER TABLE "cart_items"
ALTER COLUMN "configurationSignature" SET NOT NULL;

CREATE INDEX "cart_items_cartId_idx" ON "cart_items"("cartId");
CREATE UNIQUE INDEX "cart_items_cartId_configurationSignature_key"
ON "cart_items"("cartId", "configurationSignature");

CREATE TABLE "cart_item_variant_options" (
  "cartItemId" TEXT NOT NULL,
  "optionId" TEXT NOT NULL,
  "priceAdjustment" DECIMAL(10,2) NOT NULL,
  CONSTRAINT "cart_item_variant_options_pkey" PRIMARY KEY ("cartItemId", "optionId")
);

INSERT INTO "cart_item_variant_options" ("cartItemId", "optionId", "priceAdjustment")
SELECT ci."id", ci."variantId", vo."priceAdjustment"
FROM "cart_items" ci
JOIN "variant_options" vo ON vo."id" = ci."variantId"
WHERE ci."variantId" IS NOT NULL;

ALTER TABLE "cart_item_variant_options"
ADD CONSTRAINT "cart_item_variant_options_cartItemId_fkey"
FOREIGN KEY ("cartItemId") REFERENCES "cart_items"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_item_variant_options"
ADD CONSTRAINT "cart_item_variant_options_optionId_fkey"
FOREIGN KEY ("optionId") REFERENCES "variant_options"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_variantId_fkey";
ALTER TABLE "cart_items" DROP COLUMN "variantId";

-- Orders mirror cart customizations and snapshot purchased display data so
-- historical receipts remain stable when restaurant menus change later.
ALTER TABLE "order_items" ADD COLUMN "name" TEXT;

UPDATE "order_items" AS order_item
SET "name" = menu_item."name"
FROM "menu_items" AS menu_item
WHERE menu_item."id" = order_item."menuItemId";

ALTER TABLE "order_items" ALTER COLUMN "name" SET NOT NULL;

CREATE TABLE "order_item_variant_options" (
  "orderItemId" TEXT NOT NULL,
  "optionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priceAdjustment" DECIMAL(10,2) NOT NULL,
  CONSTRAINT "order_item_variant_options_pkey" PRIMARY KEY ("orderItemId", "optionId")
);

INSERT INTO "order_item_variant_options" (
  "orderItemId",
  "optionId",
  "name",
  "priceAdjustment"
)
SELECT
  order_item."id",
  option."id",
  option."name",
  option."priceAdjustment"
FROM "order_items" AS order_item
JOIN "variant_options" AS option ON option."id" = order_item."variantId"
WHERE order_item."variantId" IS NOT NULL;

ALTER TABLE "order_item_variant_options"
ADD CONSTRAINT "order_item_variant_options_orderItemId_fkey"
FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_item_variant_options"
ADD CONSTRAINT "order_item_variant_options_optionId_fkey"
FOREIGN KEY ("optionId") REFERENCES "variant_options"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_variantId_fkey";
ALTER TABLE "order_items" DROP COLUMN "variantId";

ALTER TABLE "order_item_addons" ADD COLUMN "name" TEXT;

UPDATE "order_item_addons" AS order_add_on
SET "name" = add_on."name"
FROM "addons" AS add_on
WHERE add_on."id" = order_add_on."addOnId";

ALTER TABLE "order_item_addons" ALTER COLUMN "name" SET NOT NULL;

DROP INDEX IF EXISTS "orders_status_idx";
DROP INDEX IF EXISTS "orders_restaurantId_idx";
CREATE INDEX "orders_restaurantId_status_idx" ON "orders"("restaurantId", "status");
CREATE INDEX "orders_restaurantId_createdAt_idx" ON "orders"("restaurantId", "createdAt");
CREATE INDEX "order_status_history_orderId_createdAt_idx"
ON "order_status_history"("orderId", "createdAt");
