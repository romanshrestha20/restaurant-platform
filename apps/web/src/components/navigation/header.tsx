import Link from "next/link";
import { ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const navigation = [
  { label: "Restaurants", href: "/restaurants" },
  { label: "Orders", href: "/orders" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-neutral-200)] bg-white/95 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          <Link
            href="/"
            className="shrink-0 text-xl font-semibold tracking-tight text-[var(--color-brand-700)]"
          >
            Green Haven
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-[var(--color-neutral-600)] transition-colors hover:text-[var(--color-brand-700)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/cart" aria-label="Cart">
              <Button variant="ghost" size="sm">
                <ShoppingBag size={18} />
                <span className="hidden sm:inline">Cart</span>
              </Button>
            </Link>

            <Link href="/account" aria-label="Account">
              <Button variant="ghost" size="sm">
                <User size={18} />
                <span className="hidden sm:inline">Account</span>
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}
