CREATE UNIQUE INDEX IF NOT EXISTS "carts_one_active_per_customer_restaurant"
ON "carts" ("userId", "restaurantId")
WHERE "status" = 'ACTIVE';
