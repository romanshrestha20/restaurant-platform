-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "restaurantSnapshot" JSONB;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "itemSnapshot" JSONB;
ALTER TABLE "order_items" ALTER COLUMN "menuItemId" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_menuItemId_fkey";

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX IF NOT EXISTS "order_items_menuItemId_idx" ON "order_items"("menuItemId");

-- AlterTable order_item_variant_options
ALTER TABLE "order_item_variant_options" DROP CONSTRAINT IF EXISTS "order_item_variant_options_pkey";
ALTER TABLE "order_item_variant_options" ADD COLUMN IF NOT EXISTS "id" TEXT;
UPDATE "order_item_variant_options" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;
ALTER TABLE "order_item_variant_options" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "order_item_variant_options" ADD CONSTRAINT "order_item_variant_options_pkey" PRIMARY KEY ("id");

ALTER TABLE "order_item_variant_options" ADD COLUMN IF NOT EXISTS "variantName" TEXT;
ALTER TABLE "order_item_variant_options" ALTER COLUMN "optionId" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "order_item_variant_options" DROP CONSTRAINT IF EXISTS "order_item_variant_options_optionId_fkey";

-- AddForeignKey
ALTER TABLE "order_item_variant_options" ADD CONSTRAINT "order_item_variant_options_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "variant_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "order_item_variant_options_orderItemId_idx" ON "order_item_variant_options"("orderItemId");
CREATE INDEX IF NOT EXISTS "order_item_variant_options_optionId_idx" ON "order_item_variant_options"("optionId");

-- AlterTable order_item_addons
ALTER TABLE "order_item_addons" DROP CONSTRAINT IF EXISTS "order_item_addons_pkey";
ALTER TABLE "order_item_addons" ADD COLUMN IF NOT EXISTS "id" TEXT;
UPDATE "order_item_addons" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;
ALTER TABLE "order_item_addons" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "order_item_addons" ADD CONSTRAINT "order_item_addons_pkey" PRIMARY KEY ("id");

ALTER TABLE "order_item_addons" ADD COLUMN IF NOT EXISTS "groupName" TEXT;
ALTER TABLE "order_item_addons" ALTER COLUMN "addOnId" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "order_item_addons" DROP CONSTRAINT IF EXISTS "order_item_addons_addOnId_fkey";

-- AddForeignKey
ALTER TABLE "order_item_addons" ADD CONSTRAINT "order_item_addons_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "addons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "order_item_addons_orderItemId_idx" ON "order_item_addons"("orderItemId");
CREATE INDEX IF NOT EXISTS "order_item_addons_addOnId_idx" ON "order_item_addons"("addOnId");
