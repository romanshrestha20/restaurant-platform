"use client";

import React from "react";
import Link from "next/link";
import { useRestaurant } from "@/providers/restaurant-provider";
import { Badge, Button, Card } from "@restaurant/ui";

export function StorefrontLanding() {
  const { restaurant } = useRestaurant();

  if (!restaurant) return null;

  const coverMedia = restaurant.media?.find(
    (m) => m.type.toLowerCase() === "cover",
  );
  const logoMedia = restaurant.media?.find(
    (m) => m.type.toLowerCase() === "logo",
  );

  // Collect featured items from all menus & categories
  const featuredItems = restaurant.menus.flatMap((menu) =>
    menu.categories.flatMap((category) =>
      category.items.filter((item) => item.isFeatured),
    ),
  );

  const allCategories = restaurant.menus.flatMap((menu) => menu.categories);

  return (
    <div>
      {/* Cover / Hero Header */}
      <div className="relative h-64 sm:h-80 w-full bg-muted overflow-hidden">
        {coverMedia?.media?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverMedia.media.url}
            alt={coverMedia.alt || restaurant.name}
            className="w-full h-full object-cover opacity-85"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/80 to-primary/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute bottom-0 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 flex items-end gap-5">
          {logoMedia?.media?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoMedia.media.url}
              alt={restaurant.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-background shadow-md shrink-0 bg-card"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary text-primary-foreground font-bold text-3xl flex items-center justify-center border-4 border-background shadow-md shrink-0">
              {restaurant.name[0]}
            </div>
          )}

          <div className="text-white">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {restaurant.name}
            </h1>
            {restaurant.description && (
              <p className="mt-1 text-xs sm:text-sm text-gray-200 line-clamp-2 max-w-2xl">
                {restaurant.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-6 text-muted-foreground">
            {restaurant.settings?.estimatedPrepMinutes && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">
                  {restaurant.settings.estimatedPrepMinutes} mins
                </span>
                <span>prep time</span>
              </div>
            )}
            {restaurant.settings?.deliveryFee != null && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">
                  €{Number(restaurant.settings.deliveryFee).toFixed(2)}
                </span>
                <span>delivery</span>
              </div>
            )}
            {restaurant.settings?.minimumOrder != null && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">
                  €{Number(restaurant.settings.minimumOrder).toFixed(2)}
                </span>
                <span>min order</span>
              </div>
            )}
          </div>

          <Link href="/menu">
            <Button size="sm">Order Now</Button>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Categories Bar */}
        {allCategories.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/menu#category-${category.id}`}
                  className="px-4 py-2 bg-secondary hover:bg-accent hover:text-accent-foreground text-secondary-foreground font-medium rounded-xl text-sm transition-colors"
                >
                  {category.name} ({category.items.length})
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured Items Section */}
        {featuredItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                Featured Items
              </h2>
              <Link
                href="/menu"
                className="text-sm font-semibold text-primary hover:underline"
              >
                See all menu items &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.slice(0, 6).map((item) => {
                const itemMedia = item.media?.[0];
                return (
                  <Card
                    key={item.id}
                    className="flex flex-col justify-between p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      {itemMedia?.media?.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={itemMedia.media.url}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover shrink-0 bg-muted"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-base">
                            {item.name}
                          </h3>
                          <Badge
                            variant="accent"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Featured
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <span className="font-extrabold text-foreground text-base">
                        €{Number(item.basePrice).toFixed(2)}
                      </span>
                      <Link href="/menu">
                        <Button variant="secondary" size="sm">
                          Customize
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Call To Action */}
        <Card className="bg-accent/40 border-accent p-8 text-center max-w-3xl mx-auto rounded-3xl">
          <h3 className="text-xl font-bold text-foreground">
            Ready to place your order?
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            Browse our complete selection of fresh, made-to-order items.
          </p>
          <Link href="/menu">
            <Button size="lg">Explore Full Menu</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
