'use client';

import React from 'react';
import Link from 'next/link';
import { useRestaurantsList } from '../hooks/use-restaurant';
import type { RestaurantSummary } from '@/types/restaurant';
import { Badge, Card, Skeleton } from '@restaurant/ui';

export function RestaurantDiscovery() {
  const { data: restaurants, isLoading, isError, error } = useRestaurantsList();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Banner */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Discover Local Restaurants
        </h1>
        <p className="mt-3 text-base sm:text-lg text-muted-foreground">
          Explore storefronts, browse handcrafted menus, and order directly from local favorites.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl border border-border" />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="border-destructive/30 bg-destructive/10 p-6 text-center max-w-md mx-auto">
          <p className="text-destructive font-semibold text-sm">
            {error?.message || 'Unable to load restaurants'}
          </p>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && (!restaurants || restaurants.length === 0) && (
        <Card className="text-center py-16 border-dashed border-border bg-card max-w-md mx-auto">
          <p className="text-muted-foreground font-medium text-sm">
            No active restaurants found at the moment.
          </p>
        </Card>
      )}

      {/* Success State */}
      {!isLoading && !isError && restaurants && restaurants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
}

function RestaurantCard({ restaurant }: { restaurant: RestaurantSummary }) {
  const coverMedia = restaurant.media?.find((m) => m.type.toLowerCase() === 'cover');
  const logoMedia = restaurant.media?.find((m) => m.type.toLowerCase() === 'logo');
  const address = restaurant.addresses?.[0];

  // In development, navigating with ?restaurant=slug allows testing tenant storefront mode easily
  const storefrontUrl = `/?restaurant=${restaurant.slug}`;

  return (
    <Link href={storefrontUrl} className="group">
      <Card className="overflow-hidden hover:border-primary/50 transition-all duration-200 hover:shadow-md flex flex-col h-full">
        {/* Cover Image Container */}
        <div className="relative h-44 w-full bg-muted overflow-hidden">
          {coverMedia?.media?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverMedia.media.url}
              alt={coverMedia.alt || restaurant.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-4xl">
              {restaurant.name[0]}
            </div>
          )}

          {/* Logo Badge */}
          {logoMedia?.media?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoMedia.media.url}
              alt={restaurant.name}
              className="absolute bottom-3 left-3 w-12 h-12 rounded-xl object-cover border-2 border-background shadow-xs bg-background"
            />
          )}
        </div>

        {/* Details */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                {restaurant.name}
              </h3>
              {address?.city && (
                <Badge variant="secondary">
                  {address.city}
                </Badge>
              )}
            </div>
            {restaurant.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {restaurant.description}
              </p>
            )}
          </div>

          {/* Badges / Metrics */}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Prep: ~{restaurant.settings?.estimatedPrepMinutes ?? 30}m</span>
            <span>Delivery: €{Number(restaurant.settings?.deliveryFee ?? 0).toFixed(2)}</span>
            {restaurant.itemCount != null && (
              <span className="font-medium text-foreground">{restaurant.itemCount} items</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
