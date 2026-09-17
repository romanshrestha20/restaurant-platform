"use client";

import { useState } from "react";
import { Badge, Button, Card, Skeleton } from "@restaurant/ui";
import { useMenu } from "../hooks/use-menu";
import { MenuItemCard } from "./menu-item-card";

export function MenuPage() {
  const { restaurant, sections, currency, isLoading, isError, error, refetch } =
    useMenu();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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

  const visibleSections = activeCategory
    ? sections.filter((section) => section.id === activeCategory)
    : sections;

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden border-b border-foreground/10 bg-[#26362f] text-white">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-[#c98a56]/30 blur-3xl" />
        <div className="relative mx-auto max-w-[90rem] px-5 py-20 sm:px-8 sm:py-28">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#e7c46b]">The kitchen is open</p>
          <h1 className="max-w-4xl text-5xl font-black tracking-[-0.05em] sm:text-8xl">
            {restaurant.name}<span className="text-[#e7c46b]">’s menu</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
            Prepared to order, rooted in good ingredients, and made for a slow moment around the table.
          </p>
        </div>
      </section>

      <nav
        aria-label="Menu categories"
        className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-[90rem] gap-1 overflow-x-auto px-5 py-4 sm:px-8">
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

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="space-y-14">
          {visibleSections.map((section) => (
            <section
              key={section.id}
              id={`category-${section.id}`}
              className="scroll-mt-32"
            >
              <div className="mb-8 flex items-end justify-between gap-4 border-b border-foreground/10 pb-5">
                <div>
                  <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
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
              <div className="grid gap-x-8 gap-y-8 md:grid-cols-2">
                {section.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} currency={currency} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
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
