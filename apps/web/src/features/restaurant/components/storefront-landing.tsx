'use client';

import React from 'react';
import Link from 'next/link';
import { useRestaurant } from '@/providers/restaurant-provider';

export function StorefrontLanding() {
  const { restaurant } = useRestaurant();

  if (!restaurant) return null;

  const coverMedia = restaurant.media?.find((m) => m.type.toLowerCase() === 'cover');
  const logoMedia = restaurant.media?.find((m) => m.type.toLowerCase() === 'logo');

  // Collect featured items from all menus & categories
  const featuredItems = restaurant.menus.flatMap((menu) =>
    menu.categories.flatMap((category) =>
      category.items.filter((item) => item.isFeatured),
    ),
  );

  // Total items
  const allCategories = restaurant.menus.flatMap((menu) => menu.categories);

  return (
    <div>
      {/* Cover / Hero Header */}
      <div className="relative h-64 sm:h-80 w-full bg-gray-900 overflow-hidden">
        {coverMedia?.media?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverMedia.media.url}
            alt={coverMedia.alt || restaurant.name}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-orange-600 to-amber-500 opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute bottom-0 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 flex items-end gap-5">
          {logoMedia?.media?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoMedia.media.url}
              alt={restaurant.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md shrink-0 bg-white"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-orange-500 text-white font-bold text-3xl flex items-center justify-center border-4 border-white shadow-md shrink-0">
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-6 text-gray-600">
            {restaurant.settings?.estimatedPrepMinutes && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-900">
                  {restaurant.settings.estimatedPrepMinutes} mins
                </span>
                <span className="text-gray-400">prep time</span>
              </div>
            )}
            {restaurant.settings?.deliveryFee != null && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-900">
                  €{Number(restaurant.settings.deliveryFee).toFixed(2)}
                </span>
                <span className="text-gray-400">delivery</span>
              </div>
            )}
            {restaurant.settings?.minimumOrder != null && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-900">
                  €{Number(restaurant.settings.minimumOrder).toFixed(2)}
                </span>
                <span className="text-gray-400">min order</span>
              </div>
            )}
          </div>

          <Link
            href="/menu"
            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-sm transition shadow-xs"
          >
            Order Now
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Categories Bar */}
        {allCategories.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/menu#category-${category.id}`}
                  className="px-4 py-2 bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-700 font-medium rounded-xl text-sm transition"
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
              <h2 className="text-xl font-bold text-gray-900">Featured Items</h2>
              <Link
                href="/menu"
                className="text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                See all menu items &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.slice(0, 6).map((item) => {
                const itemMedia = item.media?.[0];
                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition p-4"
                  >
                    <div className="flex gap-4">
                      {itemMedia?.media?.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={itemMedia.media.url}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover shrink-0 bg-gray-50"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="font-extrabold text-gray-900 text-base">
                        €{Number(item.basePrice).toFixed(2)}
                      </span>
                      <Link
                        href="/menu"
                        className="px-3 py-1 bg-orange-50 text-orange-600 hover:bg-orange-100 font-semibold rounded-lg text-xs transition"
                      >
                        Customize & Add
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Call To Action */}
        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-8 text-center max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-orange-950">Ready to place your order?</h3>
          <p className="text-sm text-orange-800 mt-1 mb-6">
            Browse our complete selection of fresh, made-to-order items.
          </p>
          <Link
            href="/menu"
            className="inline-block px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
          >
            Explore Full Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
