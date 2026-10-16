"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useRestaurant } from "@/providers/restaurant-provider";
import { useCurrentCart } from "@/features/cart/hooks/use-cart";
import { useAuth } from "@/features/auth/hooks/use-auth";

const tenantNavLinks = [
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "Orders" },
  { href: "/account", label: "Account" },
];

function CartLink({ className }: { className?: string }) {
  const { data: cart } = useCurrentCart();
  const count = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      className={`relative inline-flex items-center gap-2 rounded-full bg-foreground px-3.5 py-2 text-sm font-semibold text-background ${className ?? ""}`}
    >
      <ShoppingBag className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold leading-none text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export function StorefrontHeader() {
  const { restaurant, isTenantMode, isLoading, restaurantId } = useRestaurant();
  const { isAuthenticated, isLoading: isAuthLoading, user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logo = restaurant?.media?.find((m) => m.type.toLowerCase() === "logo");

  const linkClass = (href: string) =>
    `text-sm font-medium transition-colors ${
      pathname === href || pathname.startsWith(`${href}/`)
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;

  const authControl = isAuthLoading ? null : isAuthenticated ? (
    <button
      type="button"
      onClick={() => void logout()}
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      Sign out
    </button>
  ) : (
    <Link href="/auth" className="text-sm font-medium text-foreground hover:text-primary">
      Sign in
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          {isTenantMode && logo?.media?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo.media.url}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
              {isTenantMode ? (restaurant?.name?.[0]?.toUpperCase() ?? "R") : "P"}
            </span>
          )}
          <span className="truncate text-base font-bold">
            {isTenantMode
              ? isLoading
                ? "Loading…"
                : (restaurant?.name ?? "Storefront")
              : "Restaurant Platform"}
          </span>
        </Link>

        {isTenantMode ? (
          <>
            <nav aria-label="Storefront" className="hidden items-center gap-6 sm:flex">
              {tenantNavLinks.map(({ href, label }) => (
                <Link key={href} href={href} className={linkClass(href)}>
                  {label}
                </Link>
              ))}
              {authControl}
              {restaurantId && <CartLink />}
            </nav>
            <div className="flex items-center gap-2 sm:hidden">
              {restaurantId && <CartLink />}
              <button
                type="button"
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((open) => !open)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </>
        ) : (
          <nav aria-label="Platform" className="flex items-center gap-5">
            <Link href="/" className="text-sm font-medium hover:text-primary">
              Discover
            </Link>
            {isAuthenticated && user ? (
              <Link href="/account" title={user.email} className="text-sm font-medium hover:text-primary">
                Account
              </Link>
            ) : (
              authControl
            )}
          </nav>
        )}
      </div>

      {isTenantMode && mobileOpen && (
        <nav
          aria-label="Storefront mobile"
          className="flex flex-col gap-1 border-t border-border bg-background px-4 py-3 sm:hidden"
        >
          {tenantNavLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`rounded-lg px-3 py-2.5 ${linkClass(href)} ${pathname === href ? "bg-muted" : ""}`}
            >
              {label}
            </Link>
          ))}
          <div className="px-3 py-2.5">{authControl}</div>
        </nav>
      )}
    </header>
  );
}
