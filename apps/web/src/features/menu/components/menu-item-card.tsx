"use client";

import { useState } from "react";
import { Badge } from "@restaurant/ui";
import type { MenuItem } from "@/types/restaurant";
import { MenuItemCustomization } from "./menu-item-customization";

export function MenuItemCard({
  item,
  currency,
}: {
  item: MenuItem;
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const image = item.media[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex min-h-36 w-full gap-4 border-b border-border/70 pb-8 text-left last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 sm:gap-6"
        aria-label={`Customize ${item.name}`}
      >
        <div className="order-2 flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold leading-tight transition-colors group-hover:text-primary">
              {item.name}
            </h3>
            <span className="shrink-0 text-base font-bold text-primary">
              {formatMoney(item.basePrice, currency)}
            </span>
          </div>
          {item.description && (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          )}
          <div className="mt-auto flex items-center gap-2 pt-4">
            {item.isFeatured && <Badge variant="secondary">Featured</Badge>}
            {cartAdded ? <span role="status" className="text-xs font-semibold text-primary">Added to cart</span> : <span className="text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">Customize →</span>}
          </div>
        </div>
        <div className="order-1 h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-36 sm:w-36">
          {image?.media.url ? (
            <img
              src={image.media.url}
              alt={image.alt || item.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {item.name.slice(0, 1)}
            </div>
          )}
        </div>
      </button>
      <MenuItemCustomization
        item={item}
        currency={currency}
        open={open}
        onOpenChange={setOpen}
        onAdded={() => setCartAdded(true)}
      />
    </>
  );
}

export function formatMoney(value: number | string, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(Number(value));
  } catch {
    return `${value} ${currency}`;
  }
}
