CREATE UNIQUE INDEX "carts_one_active_per_customer_restaurant"
ON "carts" ("userId", "restaurantId")
WHERE "status" = 'ACTIVE';
