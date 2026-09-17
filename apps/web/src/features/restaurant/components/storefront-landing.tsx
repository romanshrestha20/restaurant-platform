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
    <div className="overflow-hidden bg-background">
      {/* Cover / Hero Header */}
      <div className="relative min-h-[34rem] w-full overflow-hidden bg-[#27332e] sm:min-h-[39rem]">
        {coverMedia?.media?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverMedia.media.url}
            alt={coverMedia.alt || restaurant.name}
            className="h-full w-full object-cover opacity-75"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_70%_20%,#c58a52_0%,transparent_38%),linear-gradient(135deg,#26362f_0%,#51614f_55%,#b7673e_100%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[90rem] items-end gap-5 px-5 pb-10 sm:px-8 sm:pb-14">
          {logoMedia?.media?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoMedia.media.url}
              alt={restaurant.name}
            className="h-20 w-20 shrink-0 rounded-full border-4 border-background object-cover shadow-2xl sm:h-24 sm:w-24"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-background bg-primary text-3xl font-bold text-primary-foreground shadow-2xl sm:h-24 sm:w-24">
              {restaurant.name[0]}
            </div>
          )}

          <div className="text-white">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#e7c46b]">Helsinki · seasonal kitchen</p>
            <h1 className="max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-7xl">
              {restaurant.name}
            </h1>
            {restaurant.description && (
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
                {restaurant.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="border-b border-foreground/10 bg-card">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-4 px-5 py-5 text-sm sm:px-8">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-muted-foreground">
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
      <div className="mx-auto max-w-[90rem] space-y-20 px-5 py-16 sm:px-8 sm:py-24">
        {/* Categories Bar */}
        {allCategories.length > 0 && (
          <div>
            <div className="mb-6 flex items-end justify-between border-b border-foreground/10 pb-4">
              <h2 className="text-3xl font-black tracking-tight text-foreground">Start with a section</h2>
              <span className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground sm:block">The menu</span>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden border border-foreground/10 bg-foreground/10 sm:grid-cols-4">
              {allCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/menu#category-${category.id}`}
                  className="group bg-card p-5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent sm:p-7"
                >
                <span className="block text-lg transition-transform group-hover:translate-x-1 sm:text-xl">{category.name}</span><span className="mt-2 block text-xs font-normal text-muted-foreground">{category.items.length} dishes →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured Items Section */}
        {featuredItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black tracking-tight text-foreground">
                A few favourites
              </h2>
              <Link
                href="/menu"
                className="text-sm font-semibold text-primary transition-transform hover:translate-x-1"
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
                    className="flex flex-col justify-between rounded-none border-0 border-b border-foreground/10 bg-transparent p-0 pb-5 shadow-none transition-transform hover:-translate-y-1"
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
                          <h3 className="font-bold text-foreground text-lg">
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
        <Card className="mx-auto max-w-3xl rounded-none border-0 bg-[#26362f] p-10 text-center text-white shadow-none sm:p-14">
          <h3 className="text-3xl font-black">
            Ready to place your order?
          </h3>
          <p className="mb-6 mt-2 text-sm text-white/65">
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
