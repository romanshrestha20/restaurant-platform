"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountSectionPage } from "../_components/account-section-page";

export default function FavoritesPage() {
  const [dishes, setDishes] = useState<
    Array<{
      item: {
        id: string;
        name: string;
        description: string | null;
        basePrice: string;
        media: Array<{ media: { url: string } }>;
      };
      restaurant?: string;
      slug?: string;
    }>
  >([]);
  useEffect(() => {
    try {
      const ids = Object.keys(
        JSON.parse(localStorage.getItem("tablefolk_favorite_dishes") || "{}"),
      );
      setDishes(
        ids
          .map((id) =>
            JSON.parse(
              localStorage.getItem(`tablefolk_favorite_dish_${id}`) || "null",
            ),
          )
          .filter(Boolean),
      );
    } catch {
      setDishes([]);
    }
  }, []);
  if (dishes.length)
    return (
      <AccountSectionPage
        eyebrow="Saved dishes"
        title="The good stuff, saved."
        description="Your personal shortlist of dishes worth ordering again."
      >
        <div className="favorites-grid">
          {dishes.map(({ item, restaurant, slug }) => (
            <article className="favorite-dish" key={item.id}>
              <div className="favorite-dish__image">
                {item.media[0] ? (
                  <img src={item.media[0].media.url} alt="" />
                ) : (
                  "🍽️"
                )}
              </div>
              <div>
                <p className="eyebrow">{restaurant || "Saved dish"}</p>
                <h3>{item.name}</h3>
                <p>{item.description || "A dish you saved for later."}</p>
                <Link
                  className="button button--secondary"
                  href={slug ? `/restaurants/${slug}` : "/restaurants"}
                >
                  Order again
                </Link>
              </div>
            </article>
          ))}
        </div>
      </AccountSectionPage>
    );
  return (
    <AccountSectionPage
      eyebrow="Saved dishes"
      title="The good stuff, saved."
      description="Keep the dishes you are already dreaming about close at hand."
    >
      <div className="favorites-empty">
        <div className="favorites-empty__mark" aria-hidden="true">
          <span>♡</span>
        </div>
        <div className="favorites-empty__copy">
          <p className="eyebrow">A blank plate</p>
          <h3>No dishes saved yet</h3>
          <p>
            Tap the heart on any menu item to build your personal shortlist of
            things worth ordering again.
          </p>
          <Link className="button button--primary" href="/restaurants">
            Find something delicious
          </Link>
        </div>
      </div>
    </AccountSectionPage>
  );
}
