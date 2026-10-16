"use client";

import { useState } from "react";
import { Button, Card, Skeleton } from "@restaurant/ui";
import { useMenu } from "../hooks/use-menu";
import { MenuItemCard } from "./menu-item-card";

export function MenuPage() {
  const { restaurant, sections, currency, isLoading, isError, error, refetch } =
    useMenu();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  if (isLoading) return <MenuLoading />;

  if (isError) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-16 text-center">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Menu unavailable
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            We couldn’t load the menu.
          </h1>
          <p className="mt-3 text-muted-foreground">
            {error?.messages?.[0] || "Please try again in a moment."}
          </p>
          <Button className="mt-6" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </section>
    );
  }

  if (
    !restaurant ||
    sections.length === 0 ||
    sections.every((section) => section.items.length === 0)
  ) {
    return <MenuEmpty restaurantName={restaurant?.name} />;
  }

  const query = search.trim().toLowerCase();
  const visibleSections = sections
    .filter((section) => !activeCategory || section.id === activeCategory)
    .map((section) => ({
      ...section,
      items: query
        ? section.items.filter(
            (item) =>
              item.name.toLowerCase().includes(query) ||
              item.description?.toLowerCase().includes(query),
          )
        : section.items,
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="bg-background">
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-8 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {restaurant.name}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Menu</h1>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search dishes"
            aria-label="Search dishes"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
          />
        </div>
      </section>

      <nav
        aria-label="Menu categories"
        className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-3 sm:px-6">
          <CategoryButton
            active={!activeCategory}
            onClick={() => setActiveCategory(null)}
          >
            All
          </CategoryButton>
          {sections.map((section) => (
            <CategoryButton
              key={section.id}
              active={activeCategory === section.id}
              onClick={() => setActiveCategory(section.id)}
            >
              {section.name}
            </CategoryButton>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="space-y-10">
          {visibleSections.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              No dishes match “{search}”.
            </p>
          )}
          {visibleSections.map((section) => (
            <section
              key={section.id}
              id={`category-${section.id}`}
              className="scroll-mt-32"
            >
              <div className="mb-6 flex items-end justify-between gap-4 border-b border-foreground/10 pb-5">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {section.name}
                  </h2>
                  {section.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  )}
                </div>
                <span className="hidden text-sm text-muted-foreground sm:block">
                  {section.items.length}{" "}
                  {section.items.length === 1 ? "dish" : "dishes"}
                </span>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {section.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} currency={currency} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
    >
      {children}
    </button>
  );
}

function MenuLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Skeleton className="h-48 w-full rounded-3xl" />
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex gap-5">
            <Skeleton className="h-32 w-32 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuEmpty({ restaurantName }: { restaurantName?: string }) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4 py-16 text-center">
      <Card className="w-full border-dashed p-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Menu coming soon
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {restaurantName || "This restaurant"} is preparing something good.
        </h1>
        <p className="mt-3 text-muted-foreground">
          There are no available dishes to show right now. Please check back
          soon.
        </p>
      </Card>
    </section>
  );
}
