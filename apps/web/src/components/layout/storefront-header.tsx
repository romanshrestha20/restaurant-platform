'use client';

import React from 'react';
import Link from 'next/link';
import { useRestaurant } from '@/providers/restaurant-provider';

export function StorefrontHeader() {
  const { restaurant, isTenantMode, isLoading } = useRestaurant();

  const logoMedia = restaurant?.media?.find(
    (m) => m.type.toLowerCase() === 'logo',
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          {isTenantMode ? (
            <Link href="/" className="flex items-center gap-3 group">
              {logoMedia?.media?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoMedia.media.url}
                  alt={restaurant?.name || 'Restaurant Logo'}
                  className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
                  {restaurant?.name ? restaurant.name[0]?.toUpperCase() : 'R'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-base leading-tight group-hover:text-orange-600 transition">
                  {isLoading ? 'Loading restaurant...' : restaurant?.name || 'Storefront'}
                </span>
                {restaurant?.settings?.estimatedPrepMinutes && (
                  <span className="text-xs text-gray-500">
                    Prep: ~{restaurant.settings.estimatedPrepMinutes} mins
                  </span>
                )}
              </div>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                P
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">
                Restaurant<span className="text-orange-600">Platform</span>
              </span>
            </Link>
          )}
        </div>

        {/* Center/Right: Navigation Links */}
        <nav className="flex items-center gap-3 sm:gap-6">
          {isTenantMode ? (
            <>
              <Link
                href="/menu"
                className="text-sm font-medium text-gray-700 hover:text-orange-600 transition py-1"
              >
                Menu
              </Link>
              <Link
                href="/orders"
                className="text-sm font-medium text-gray-700 hover:text-orange-600 transition py-1"
              >
                Orders
              </Link>
              <Link
                href="/account"
                className="text-sm font-medium text-gray-700 hover:text-orange-600 transition py-1"
              >
                Account
              </Link>
              <Link
                href="/cart"
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-sm font-medium transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span>Cart</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="text-sm font-medium text-gray-700 hover:text-orange-600 transition py-1"
              >
                Discover
              </Link>
              <Link
                href="/account"
                className="text-sm font-medium text-gray-700 hover:text-orange-600 transition py-1"
              >
                Sign In
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
