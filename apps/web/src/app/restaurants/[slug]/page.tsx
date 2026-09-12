import Link from "next/link";
import { notFound } from "next/navigation";
import { getMediaUrl, getRestaurantCatalog } from "@/lib/catalog";

function formatPrice(value: string, currency: string) {
  return `${Number(value).toFixed(2)} ${currency}`;
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let restaurant;
  try {
    restaurant = await getRestaurantCatalog(slug);
  } catch {
    notFound();
  }

  const hero = restaurant.media.find((item) => item.type === "COVER") ?? restaurant.media.find((item) => item.type === "LOGO");
  const itemCount = restaurant.menus.reduce(
    (total, menu) => total + menu.categories.reduce((categoryTotal, category) => categoryTotal + category.items.length, 0),
    0,
  );

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link href="/restaurants" className="text-sm font-medium text-neutral-600 hover:text-neutral-950">
          ← All restaurants
        </Link>

        <header className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
          {hero && (
            <img src={getMediaUrl(hero.media.url)} alt={hero.alt ?? restaurant.name} className="h-64 w-full object-cover" />
          )}
          <div className="p-7">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-950">{restaurant.name}</h1>
            <p className="mt-3 max-w-3xl text-neutral-600">
              {restaurant.description ?? "Explore the available menu."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-neutral-600">
              <span className="rounded-full bg-neutral-100 px-3 py-1.5">{itemCount} items</span>
              {restaurant.settings && (
                <>
                  <span className="rounded-full bg-neutral-100 px-3 py-1.5">
                    {restaurant.settings.estimatedPrepMinutes} min prep
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1.5">
                    Delivery {formatPrice(restaurant.settings.deliveryFee, restaurant.currency)}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-3 py-1.5">
                    Minimum {formatPrice(restaurant.settings.minimumOrder, restaurant.currency)}
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="mt-10 space-y-10">
          {restaurant.menus.map((menu) => (
            <section key={menu.id}>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-neutral-950">{menu.name}</h2>
                {menu.description && <p className="mt-1 text-neutral-600">{menu.description}</p>}
              </div>

              <div className="space-y-8">
                {menu.categories.map((category) => (
                  <section key={category.id}>
                    <h3 className="mb-4 text-lg font-semibold text-neutral-900">{category.name}</h3>
                    {category.description && <p className="mb-4 text-sm text-neutral-500">{category.description}</p>}

                    <div className="grid gap-4 md:grid-cols-2">
                      {category.items.map((item) => {
                        const image = item.media[0];
                        return (
                          <article key={item.id} className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                            {image ? (
                              <img
                                src={getMediaUrl(image.media.url)}
                                alt={image.alt ?? item.name}
                                className="h-28 w-28 shrink-0 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs text-neutral-400">
                                No image
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="font-semibold text-neutral-950">{item.name}</h4>
                                <span className="shrink-0 text-sm font-semibold text-neutral-950">
                                  {formatPrice(item.basePrice, restaurant.currency)}
                                </span>
                              </div>
                              {item.description && <p className="mt-2 text-sm leading-5 text-neutral-600">{item.description}</p>}
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
                                {item.isFeatured && <span className="rounded-full bg-neutral-100 px-2.5 py-1">Featured</span>}
                                {item.preparationTime != null && (
                                  <span className="rounded-full bg-neutral-100 px-2.5 py-1">{item.preparationTime} min</span>
                                )}
                                {item.calories != null && (
                                  <span className="rounded-full bg-neutral-100 px-2.5 py-1">{item.calories} kcal</span>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
