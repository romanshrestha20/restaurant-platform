import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <section className="max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Restaurant platform</p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight text-neutral-950">Find your next meal</h1>
        <p className="mt-4 text-lg leading-8 text-neutral-600">
          Choose a restaurant, browse its menu, and get ready to order.
        </p>
        <Link
          href="/restaurants"
          className="mt-8 inline-flex rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-white hover:bg-neutral-800"
        >
          Browse restaurants
        </Link>
      </section>
    </main>
  );
}
