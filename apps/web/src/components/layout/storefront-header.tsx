"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useRestaurant } from "@/providers/restaurant-provider";
import { cartService } from "@/features/cart/services/cart.service";
import { useAuth } from "@/features/auth/hooks/use-auth";

function CartBadge({ restaurantId }: { restaurantId: string }) {
  const { data: cart } = useQuery({
    queryKey: ["cart", "current", restaurantId],
    queryFn: () => cartService.getCurrent(restaurantId),
    staleTime: 30_000,
  });

  const count = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  if (count === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function StorefrontHeader() {
  const { restaurant, isTenantMode, isLoading, restaurantId } = useRestaurant();
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logoMedia = restaurant?.media?.find(
    (m) => m.type.toLowerCase() === "logo",
  );

  const navLinkClass = (href: string) =>
    [
      "py-1 text-sm font-medium transition-colors",
      pathname === href
        ? "text-foreground font-semibold"
        : "text-muted-foreground hover:text-foreground",
    ].join(" ");

  const tenantNavLinks = [
    { href: "/menu", label: "Menu" },
    { href: "/orders", label: "Orders" },
    { href: "/account", label: "Account" },
  ];

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
                  alt={restaurant?.name || "Restaurant Logo"}
                  className="w-10 h-10 rounded-xl object-cover border border-border shadow-xs"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {restaurant?.name ? restaurant.name[0]?.toUpperCase() : "R"}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors">
                  {isLoading
                    ? "Loading restaurant..."
                    : restaurant?.name || "Storefront"}
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

        {/* Desktop Navigation */}
        {isTenantMode ? (
          <nav className="hidden sm:flex items-center gap-6">
            {tenantNavLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={navLinkClass(href)}>
                {label}
              </Link>
            ))}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
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
              {restaurantId && <CartBadge restaurantId={restaurantId} />}
            </Link>
          </nav>
        ) : (
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors py-1"
            >
              Discover
            </Link>
            {isAuthenticated && user ? (
              <Link
                href="/auth"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                title={user.email}
              >
                {user.email[0]?.toUpperCase()}
              </Link>
            ) : (
              <Link
                href="/account"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors py-1"
              >
                Sign In
              </Link>
            )}
          </nav>
        )}

        {/* Mobile: Cart icon + hamburger (tenant mode only) */}
        {isTenantMode && (
          <div className="flex sm:hidden items-center gap-3">
            <Link
              href="/cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background"
              aria-label="Cart"
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
              {restaurantId && <CartBadge restaurantId={restaurantId} />}
            </Link>
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {isTenantMode && mobileMenuOpen && (
        <div className="sm:hidden border-t border-foreground/10 bg-background/95 backdrop-blur-md px-5 py-3 flex flex-col gap-1">
          {tenantNavLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className={[
                "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
