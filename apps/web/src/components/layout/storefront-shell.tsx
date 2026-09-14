'use client';

import React, { type ReactNode } from 'react';
import { useRestaurant } from '@/providers/restaurant-provider';
import { StorefrontHeader } from './storefront-header';
import { StorefrontFooter } from './storefront-footer';
import { RestaurantNotFound } from './restaurant-not-found';

interface StorefrontShellProps {
  children: ReactNode;
}

export function StorefrontShell({ children }: StorefrontShellProps) {
  const { isTenantMode, isLoading, isError, slug, error } = useRestaurant();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <StorefrontHeader />

      <main className="flex-1">
        {isTenantMode && isLoading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Resolving restaurant...</p>
          </div>
        ) : isTenantMode && isError ? (
          <RestaurantNotFound
            slug={slug}
            message={error?.messages?.[0] || 'Unable to load restaurant storefront'}
          />
        ) : (
          children
        )}
      </main>

      <StorefrontFooter />
    </div>
  );
}
