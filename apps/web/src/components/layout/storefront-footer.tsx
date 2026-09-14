'use client';

import React from 'react';
import { useRestaurant } from '@/providers/restaurant-provider';

export function StorefrontFooter() {
  const { restaurant, isTenantMode } = useRestaurant();

  return (
    <footer className="w-full bg-muted/40 border-t border-border mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        {isTenantMode && restaurant ? (
          <div>
            <p className="font-semibold text-foreground">{restaurant.name}</p>
            {restaurant.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{restaurant.description}</p>
            )}
          </div>
        ) : (
          <div>
            <p className="font-semibold text-foreground">Restaurant Platform</p>
            <p className="text-xs text-muted-foreground">Order from your favorite local restaurants</p>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} All rights reserved.
        </div>
      </div>
    </footer>
  );
}
