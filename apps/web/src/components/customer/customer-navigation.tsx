"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/modules/auth";
import { useLocation } from "@/lib/location/location-context";
import { useRestaurants } from "@/modules/restaurants/hooks/use-restaurants";
import { ThemeSelector } from "@/components/ui";

export function CustomerNavigation({
  onSearchChange,
  searchValue = "",
}: {
  onSearchChange?: (val: string) => void;
  searchValue?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const {
    currentLocation,
    setLocation,
    popularLocations,
    useCurrentGpsLocation,
    isGpsLoading,
    gpsError,
  } = useLocation();
  const { restaurants: managedRestaurants, status: managedRestaurantsStatus } =
    useRestaurants();
  const firstManagedRestaurant = managedRestaurants[0];

  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState(searchValue);
  const [cartCount, setCartCount] = useState(0);

  const locRef = useRef<HTMLDivElement>(null);
  const accRef = useRef<HTMLDivElement>(null);

  // Sync cart count from local storage or carts
  useEffect(() => {
    const updateCount = () => {
      try {
        let totalItems = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("tablefolk_customer_cart_")) {
            const cartData = JSON.parse(localStorage.getItem(key) || "{}");
            if (cartData.items && Array.isArray(cartData.items)) {
              totalItems += cartData.items.reduce(
                (sum: number, item: any) => sum + (item.quantity || 1),
                0,
              );
            }
          }
        }
        setCartCount(totalItems);
      } catch {
        // ignore
      }
    };

    updateCount();
    window.addEventListener("storage", updateCount);
    const interval = setInterval(updateCount, 2000);
    return () => {
      window.removeEventListener("storage", updateCount);
      clearInterval(interval);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) {
        setLocationMenuOpen(false);
      }
      if (accRef.current && !accRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(headerSearch);
    } else {
      router.push(`/restaurants?q=${encodeURIComponent(headerSearch)}`);
    }
  };

  const isRestaurantsActive =
    pathname === "/restaurants" ||
    pathname === "/" ||
    pathname.startsWith("/order/");
  const isOrdersActive = pathname.startsWith("/orders");

  return (
    <header className="tf-header">
      <div className="tf-header__inner">
        {/* Brand & Location */}
        <div className="tf-header__left">
          <Link
            href="/restaurants"
            className="tf-brand"
            aria-label="Tablefolk Home"
          >
            <span className="tf-brand__seal">T</span>
            <span className="tf-brand__name">Tablefolk</span>
          </Link>

          <div className="tf-location-picker" ref={locRef}>
            <button
              type="button"
              className="tf-location-picker__btn"
              onClick={() => setLocationMenuOpen((v) => !v)}
              aria-expanded={locationMenuOpen}
              aria-haspopup="true"
            >
              <svg
                className="tf-icon-pin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="tf-location-picker__label">
                {currentLocation.fullAddress}
              </span>
              <svg
                className="tf-icon-caret"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {locationMenuOpen && (
              <div className="tf-location-dropdown">
                <div className="tf-location-dropdown__header">
                  <span>Deliver to:</span>
                </div>
                <button
                  type="button"
                  className="tf-location-dropdown__gps"
                  onClick={() => {
                    void useCurrentGpsLocation();
                    setLocationMenuOpen(false);
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>
                    {isGpsLoading
                      ? "Detecting current location..."
                      : "Use current location"}
                  </span>
                </button>
                {gpsError && (
                  <p className="tf-location-dropdown__error" role="alert">
                    {gpsError}
                  </p>
                )}
                <div className="tf-location-dropdown__divider" />
                <div className="tf-location-dropdown__list">
                  {popularLocations.map((loc) => (
                    <button
                      key={loc.city}
                      type="button"
                      className={`tf-location-dropdown__item ${loc.city === currentLocation.city ? "is-selected" : ""}`}
                      onClick={() => {
                        setLocation(loc);
                        setLocationMenuOpen(false);
                      }}
                    >
                      <span className="tf-location-dropdown__city">
                        {loc.city}
                      </span>
                      <span className="tf-location-dropdown__region">
                        {loc.region}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="tf-header__search">
          <form onSubmit={handleSearchSubmit} className="tf-search-form">
            <svg
              className="tf-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search dishes, meals, or cuisines"
              value={headerSearch}
              onChange={(e) => {
                setHeaderSearch(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              className="tf-search-input"
            />
            {headerSearch && (
              <button
                type="button"
                className="tf-search-clear"
                onClick={() => {
                  setHeaderSearch("");
                  if (onSearchChange) onSearchChange("");
                }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Right Navigation */}
        <div className="tf-header__right">
          <nav className="tf-nav-links" aria-label="Customer Navigation">
            <Link
              href="/restaurants#categories"
              className={`tf-nav-link ${isRestaurantsActive ? "is-active" : ""}`}
            >
              Categories
            </Link>
            <Link
              href="/orders"
              className={`tf-nav-link ${isOrdersActive ? "is-active" : ""}`}
            >
              Orders
            </Link>
          </nav>

          <ThemeSelector compact />

          {/* Account Profile Dropdown */}
          <div className="tf-account-menu" ref={accRef}>
            <button
              type="button"
              className="tf-account-btn"
              onClick={() => setAccountMenuOpen((v) => !v)}
              aria-label="User account menu"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            </button>

            {accountMenuOpen && (
              <div className="tf-account-dropdown">
                {user ? (
                  <>
                    <div className="tf-account-dropdown__user">
                      <strong>{user.profile?.firstName || user.email}</strong>
                      <span>{user.email}</span>
                    </div>
                    <div className="tf-account-dropdown__divider" />
                    <Link
                      href="/account/profile"
                      className="tf-account-dropdown__item"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Profile & Addresses
                    </Link>
                    <Link
                      href="/account/favorites"
                      className="tf-account-dropdown__item"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Saved Favorites
                    </Link>
                    <Link
                      href="/orders"
                      className="tf-account-dropdown__item"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Order History
                    </Link>
                    <Link
                      href="/account/reservations"
                      className="tf-account-dropdown__item"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Reservations
                    </Link>
                    {managedRestaurantsStatus === "ready" &&
                      firstManagedRestaurant && (
                        <Link
                          href={`/restaurants/${firstManagedRestaurant.restaurant.id}`}
                          className="tf-account-dropdown__item"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          Manage restaurants
                        </Link>
                      )}
                    <div className="tf-account-dropdown__divider" />
                    <button
                      type="button"
                      className="tf-account-dropdown__item is-danger"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        void signOut().finally(() => router.replace("/login"));
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="tf-account-dropdown__guest">
                      <p>Welcome to Tablefolk</p>
                      <span>Sign in to track orders and save addresses.</span>
                    </div>
                    <div className="tf-account-dropdown__divider" />
                    <Link
                      href="/login"
                      className="tf-account-dropdown__item is-primary"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="tf-account-dropdown__item"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Create an account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cart Icon & Badge */}
          <Link
            href="/cart"
            className="tf-cart-btn"
            aria-label={`Shopping cart with ${cartCount} items`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            {cartCount > 0 && (
              <span className="tf-cart-badge">{cartCount}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
