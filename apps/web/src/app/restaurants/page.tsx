import Link from "next/link";
import { getMediaUrl, getRestaurants } from "@/lib/catalog";

function getCoverUrl(media: { type: string; media: { url: string } }[]) {
  const cover = media.find((item) => item.type === "COVER") ?? media.find((item) => item.type === "LOGO");
  return cover ? getMediaUrl(cover.media.url) : null;
}

export default async function RestaurantsPage() {
  const restaurants = await getRestaurants();

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-500">Restaurant platform</p>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-950">Choose a restaurant</h1>
          <p className="mt-3 max-w-2xl text-neutral-600">
            Browse restaurants, compare delivery details, and open a menu.
          </p>
        </header>

        {restaurants.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold text-neutral-900">No restaurants available</h2>
            <p className="mt-2 text-neutral-600">There are no active restaurants accepting orders right now.</p>
          </section>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => {
              const coverUrl = getCoverUrl(restaurant.media);
              const address = restaurant.addresses[0];

              return (
                <article key={restaurant.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                  {coverUrl ? (
                    <img src={coverUrl} alt={restaurant.name} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-neutral-100 text-neutral-400">No image</div>
                  )}

                  <div className="p-5">
                    <h2 className="text-xl font-semibold text-neutral-950">{restaurant.name}</h2>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-neutral-600">
                      {restaurant.description ?? "Discover the menu and place your order."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-600">
                      {address?.city && <span className="rounded-full bg-neutral-100 px-3 py-1">{address.city}</span>}
                      <span className="rounded-full bg-neutral-100 px-3 py-1">{restaurant.itemCount} items</span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1">
                        {restaurant.settings?.estimatedPrepMinutes ?? 0} min prep
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-4">
                      <span className="text-sm text-neutral-500">
                        Delivery from {restaurant.deliveryFee.toFixed(2)} {restaurant.currency}
                      </span>
                      <Link
                        href={`/restaurants/${restaurant.slug}`}
                        className="rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                      >
                        View menu
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
