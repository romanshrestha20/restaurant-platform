'use client';

import React from 'react';
import { useRestaurant } from '@/providers/restaurant-provider';

export function StorefrontFooter() {
  const { restaurant, isTenantMode } = useRestaurant();

  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        {isTenantMode && restaurant ? (
          <div>
            <p className="font-semibold text-gray-700">{restaurant.name}</p>
            {restaurant.description && (
              <p className="text-xs text-gray-400 mt-0.5">{restaurant.description}</p>
            )}
          </div>
        ) : (
          <div>
            <p className="font-semibold text-gray-700">Restaurant Platform</p>
            <p className="text-xs text-gray-400">Order from your favorite local restaurants</p>
          </div>
        )}
        <div className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} All rights reserved.
        </div>
      </div>
    </footer>
  );
}
