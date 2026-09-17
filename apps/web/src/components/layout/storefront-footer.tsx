'use client';

import React from 'react';
import { useRestaurant } from '@/providers/restaurant-provider';

export function StorefrontFooter() {
  const { restaurant, isTenantMode } = useRestaurant();

  return (
    <footer className="mt-auto w-full border-t border-foreground/10 bg-foreground py-10 text-background">
      <div className="mx-auto flex max-w-[90rem] flex-col items-center justify-between gap-4 px-5 text-sm sm:flex-row sm:px-8">
        {isTenantMode && restaurant ? (
          <div>
            <p className="font-semibold">{restaurant.name}</p>
            {restaurant.description && (
              <p className="mt-0.5 text-xs text-background/60">{restaurant.description}</p>
            )}
          </div>
        ) : (
          <div>
            <p className="font-semibold">Restaurant Platform</p>
            <p className="text-xs text-background/60">Order from your favorite local restaurants</p>
          </div>
        )}
          <div className="text-xs text-background/50">
          &copy; {new Date().getFullYear()} All rights reserved.
        </div>
      </div>
    </footer>
  );
}
