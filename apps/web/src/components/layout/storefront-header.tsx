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
    <header className="sticky top-0 z-40 w-full border-b border-foreground/10 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-center justify-between px-5 sm:px-8">
        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          {isTenantMode ? (
            <Link href="/" className="flex items-center gap-3 group">
              {logoMedia?.media?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoMedia.media.url}
                  alt={restaurant?.name || 'Restaurant Logo'}
                  className="w-10 h-10 rounded-xl object-cover border border-border shadow-xs"
                />
              ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {restaurant?.name ? restaurant.name[0]?.toUpperCase() : 'R'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors">
                  {isLoading ? 'Loading restaurant...' : restaurant?.name || 'Storefront'}
                </span>
                {restaurant?.settings?.estimatedPrepMinutes && (
                  <span className="text-xs text-muted-foreground">
                    Prep: ~{restaurant.settings.estimatedPrepMinutes} mins
                  </span>
                )}
              </div>
            </Link>
          ) : (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xl shadow-xs">
                P
              </div>
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                Restaurant<span className="text-primary">Platform</span>
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
                    className="py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Menu
              </Link>
              <Link
                href="/orders"
                className="hidden py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Orders
              </Link>
              <Link
                href="/account"
                className="hidden py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Account
              </Link>
              <Link
                href="/cart"
                className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
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
                className="text-sm font-medium text-foreground hover:text-primary transition-colors py-1"
              >
                Discover
              </Link>
              <Link
                href="/account"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors py-1"
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
