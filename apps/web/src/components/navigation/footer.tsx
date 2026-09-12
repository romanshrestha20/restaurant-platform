import Link from "next/link";
import { Container } from "@/components/ui/container";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)]">
      <Container>
        <div className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="font-semibold text-[var(--color-brand-700)]"
            >
              Green Haven
            </Link>

            <p className="mt-2 text-sm text-[var(--color-neutral-500)]">
              Discover good food from local restaurants.
            </p>
          </div>

          <nav className="flex gap-5 text-sm text-[var(--color-neutral-500)]">
            <Link
              href="/restaurants"
              className="hover:text-[var(--color-brand-700)]"
            >
              Restaurants
            </Link>

            <Link
              href="/orders"
              className="hover:text-[var(--color-brand-700)]"
            >
              Orders
            </Link>

            <Link
              href="/account"
              className="hover:text-[var(--color-brand-700)]"
            >
              Account
            </Link>
          </nav>
        </div>

        <div className="border-t border-[var(--color-neutral-200)] py-5 text-xs text-[var(--color-neutral-500)]">
          © {new Date().getFullYear()} Green Haven. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
