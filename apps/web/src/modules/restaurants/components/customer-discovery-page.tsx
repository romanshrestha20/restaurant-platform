"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, ErrorState, PageSkeleton } from "@/components/ui";
import { CustomerNavigation } from "@/components/customer";
import { customerRestaurantService } from "../services/customer-restaurant.service";
import type { CustomerRestaurant } from "../types/customer-restaurant.types";
import { useLocation } from "@/lib/location/location-context";

const CUISINE_PILLS = [
  "All",
  "Pizza",
  "Sushi",
  "Burgers",
  "Vegan",
  "Salads",
  "Modern European",
  "Indian",
  "Argentinian grill",
];

export function CustomerDiscoveryPage() {
  const [restaurants, setRestaurants] = useState<CustomerRestaurant[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const { currentLocation } = useLocation();

  const load = () => {
    setStatus("loading");
    void customerRestaurantService
      .list({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      })
      .then((items) => {
        setRestaurants(items);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };

  useEffect(() => {
    load();
  }, [currentLocation]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tablefolk_favorite_restaurants");
      if (saved) setFavorites(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, restaurantId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = { ...prev, [restaurantId]: !prev[restaurantId] };
      try {
        localStorage.setItem(
          "tablefolk_favorite_restaurants",
          JSON.stringify(next),
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  const visible = useMemo(() => {
    return restaurants.filter((restaurant) => {
      // Query filter
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        `${restaurant.name} ${restaurant.cuisine || ""} ${restaurant.description || ""} ${restaurant.addresses[0]?.city || ""}`
          .toLowerCase()
          .includes(normalizedQuery);

      // Category pill filter
      const matchesCategory =
        activeCategory === "All" ||
        (restaurant.cuisine &&
          restaurant.cuisine
            .toLowerCase()
            .includes(activeCategory.toLowerCase())) ||
        (restaurant.name &&
          restaurant.name
            .toLowerCase()
            .includes(activeCategory.toLowerCase())) ||
        (restaurant.description &&
          restaurant.description
            .toLowerCase()
            .includes(activeCategory.toLowerCase()));

      return matchesQuery && matchesCategory;
    });
  }, [query, activeCategory, restaurants]);

  if (status === "loading") return <PageSkeleton className="discovery-page" />;
  if (status === "error") {
    return (
      <ErrorState
        title="Restaurants unavailable"
        description="We could not load places accepting orders right now."
        action={<Button onClick={() => load()}>Try again</Button>}
      />
    );
  }

  return (
    <div className="tf-walkthrough-root">
      <div className="tf-container-wrapper">
        <main className="tf-app-card">
          <CustomerNavigation searchValue={query} onSearchChange={setQuery} />

          {/* Hero Section */}
          <section className="tf-hero-section">
            <div className="tf-hero-content">
              <span className="tf-hero-eyebrow">
                DELIVERING TO {currentLocation.fullAddress.toUpperCase()}
              </span>
              <h2 className="tf-hero-heading">What are you in the mood for?</h2>

              {/* Big Hero Search Bar */}
              <div className="tf-hero-search">
                <svg
                  className="tf-hero-search__icon"
                  width="18"
                  height="18"
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
                  className="tf-hero-search__input"
                  placeholder="Search restaurants or dishes"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="tf-hero-search__clear"
                    onClick={() => setQuery("")}
                    aria-label="Clear query"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Cuisine Filter Pills */}
              <div
                className="tf-cuisine-pills"
                role="tablist"
                aria-label="Cuisine categories"
              >
                {CUISINE_PILLS.map((pill) => {
                  const isActive = activeCategory === pill;
                  return (
                    <button
                      key={pill}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`tf-pill-btn ${isActive ? "is-active" : ""}`}
                      onClick={() => setActiveCategory(pill)}
                    >
                      {pill}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Restaurants Grid Section */}
          <section
            className="tf-restaurants-section"
            aria-labelledby="nearby-restaurants-heading"
          >
            <div className="tf-restaurants-header">
              <h3 id="nearby-restaurants-heading" className="tf-section-title">
                Nearby restaurants
              </h3>
            </div>

            {!visible.length ? (
              <div className="tf-empty-discovery">
                <h4>No matching restaurants</h4>
                <p>
                  Try searching for a different dish name or choose another
                  category filter.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setActiveCategory("All");
                  }}
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              <div className="tf-restaurant-grid">
                {visible.map((restaurant, index) => {
                  const cover = restaurant.media.find(
                    (item) => item.type === "COVER",
                  );
                  const coverUrl =
                    cover?.media.url ||
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";
                  const isFav = !!favorites[restaurant.id];
                  const rating = restaurant.rating || 4.7;
                  const cuisine = restaurant.cuisine || "Gourmet Kitchen";
                  const deliveryTime =
                    restaurant.deliveryTime ||
                    `${restaurant.settings?.estimatedPrepMinutes || 25}–${(restaurant.settings?.estimatedPrepMinutes || 25) + 10} min`;
                  const deliveryFeeText =
                    restaurant.deliveryFeeText ||
                    (restaurant.deliveryFee === 0
                      ? "Free delivery"
                      : `€${restaurant.deliveryFee?.toFixed(2) || "1.99"} delivery`);

                  return (
                    <Link
                      href={`/order/${restaurant.slug}`}
                      key={restaurant.id}
                      className={`tf-restaurant-card ${restaurant.isClosed ? "is-closed" : ""}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Card Media Header */}
                      <div className="tf-card-image-wrap">
                        <img
                          src={coverUrl}
                          alt={cover?.alt || restaurant.name}
                          className="tf-card-image"
                          loading="lazy"
                        />

                        {/* Status Badges */}
                        {restaurant.isClosed && (
                          <span className="tf-card-badge is-closed-badge">
                            CLOSED
                          </span>
                        )}

                        {/* Heart Favorite Button */}
                        <button
                          type="button"
                          className={`tf-card-favorite ${isFav ? "is-favorited" : ""}`}
                          onClick={(e) => toggleFavorite(e, restaurant.id)}
                          aria-label={`Save ${restaurant.name} to favorites`}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill={isFav ? "#e11d48" : "none"}
                            stroke={isFav ? "#e11d48" : "#ffffff"}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                          </svg>
                        </button>
                      </div>

                      {/* Card Details */}
                      <div className="tf-card-body">
                        <div className="tf-card-title-row">
                          <h4 className="tf-card-name">{restaurant.name}</h4>
                          <span className="tf-card-rating">
                            <span className="tf-star">★</span>{" "}
                            {rating.toFixed(1)}
                          </span>
                        </div>

                        <div className="tf-card-meta">
                          <span>{cuisine}</span>
                          <span className="tf-dot">·</span>
                          <span>{deliveryTime}</span>
                          <span className="tf-dot">·</span>
                          <span>{deliveryFeeText}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
