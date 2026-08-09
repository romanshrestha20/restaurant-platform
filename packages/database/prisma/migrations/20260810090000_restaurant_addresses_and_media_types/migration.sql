-- CreateEnum
CREATE TYPE "RestaurantMediaType" AS ENUM ('LOGO', 'COVER');

-- AlterTable
ALTER TABLE "restaurant_media" ADD COLUMN "type" "RestaurantMediaType";

-- Existing restaurant media predates explicit roles. Preserve at most two assets
-- per restaurant by treating their current display order as logo, then cover.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "restaurant_media"
    GROUP BY "restaurantId"
    HAVING COUNT(*) > 2
  ) THEN
    RAISE EXCEPTION 'Cannot assign LOGO/COVER roles: a restaurant has more than two existing media records';
  END IF;
END $$;

WITH ranked_media AS (
  SELECT
    "restaurantId",
    "mediaId",
    ROW_NUMBER() OVER (
      PARTITION BY "restaurantId"
      ORDER BY "sortOrder", "mediaId"
    ) AS media_rank
  FROM "restaurant_media"
)
UPDATE "restaurant_media" AS restaurant_media
SET "type" = CASE
  WHEN ranked_media.media_rank = 1 THEN 'LOGO'::"RestaurantMediaType"
  ELSE 'COVER'::"RestaurantMediaType"
END
FROM ranked_media
WHERE restaurant_media."restaurantId" = ranked_media."restaurantId"
  AND restaurant_media."mediaId" = ranked_media."mediaId";

ALTER TABLE "restaurant_media" ALTER COLUMN "type" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_media_restaurantId_type_key"
ON "restaurant_media"("restaurantId", "type");

-- CreateTable
CREATE TABLE "restaurant_addresses" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_addresses_pkey" PRIMARY KEY ("id")
);

-- Backfill each restaurant's embedded address as its primary address.
INSERT INTO "restaurant_addresses" (
  "id",
  "restaurantId",
  "label",
  "street",
  "city",
  "state",
  "postalCode",
  "country",
  "isPrimary",
  "createdAt",
  "updatedAt"
)
SELECT
  'restaurant-address-' || "id",
  "id",
  'Primary',
  "address",
  "city",
  "state",
  "postalCode",
  "country",
  true,
  "createdAt",
  "updatedAt"
FROM "restaurants";

-- CreateIndex
CREATE INDEX "restaurant_addresses_restaurantId_idx"
ON "restaurant_addresses"("restaurantId");

-- PostgreSQL partial uniqueness enforces at most one primary address while
-- allowing any number of non-primary addresses for the same restaurant.
CREATE UNIQUE INDEX "restaurant_addresses_one_primary_per_restaurant"
ON "restaurant_addresses"("restaurantId")
WHERE "isPrimary" = true;

-- AddForeignKey
ALTER TABLE "restaurant_addresses"
ADD CONSTRAINT "restaurant_addresses_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove the legacy embedded address after its data has been preserved.
ALTER TABLE "restaurants"
  DROP COLUMN "address",
  DROP COLUMN "city",
  DROP COLUMN "state",
  DROP COLUMN "postalCode",
  DROP COLUMN "country";

-- Closed weekdays do not need placeholder opening and closing times. The
-- existing unique constraint still limits the schedule to one interval a day.
ALTER TABLE "opening_hours"
  ALTER COLUMN "opensAt" DROP NOT NULL,
  ALTER COLUMN "closesAt" DROP NOT NULL;
