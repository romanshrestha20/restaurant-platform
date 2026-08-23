'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Brand, Button, Dropdown, DropdownItem, ThemeSelector } from '@/components/ui';
import { useAuth } from '@/modules/auth';

const links = [
  { label: 'Home', href: '/restaurants' },
  { label: 'Menu', href: '/restaurants' },
  { label: 'Cart', href: '/cart' },
  { label: 'Orders', href: '/orders' },
];

export function CustomerNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const active = (href: string) => href === '/restaurants'
    ? pathname === '/restaurants' || pathname.startsWith('/order/')
    : pathname.startsWith(href);

  return (
    <header className="customer-navigation">
      <Brand href="/restaurants" />
      <nav aria-label="Customer navigation">
        {links.map((link) => (
          <Link className={active(link.href) ? 'is-active' : undefined} href={link.href} key={link.label}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="customer-navigation__account">
        {user ? (
          <Dropdown
            label="Open account menu"
            trigger={<span className="customer-navigation__greeting">Hello, {user.profile?.firstName ?? 'there'} <span aria-hidden="true">⌄</span></span>}
          >
            <DropdownItem onClick={() => router.push('/account/profile')}>Profile settings</DropdownItem>
            <DropdownItem onClick={() => router.push('/account/favorites')}>Favorites</DropdownItem>
            <DropdownItem onClick={() => router.push('/orders')}>Orders</DropdownItem>
            <DropdownItem onClick={() => router.push('/restaurants')}>Browse restaurants</DropdownItem>
            <DropdownItem danger onClick={() => void signOut().finally(() => router.replace('/login'))}>Sign out</DropdownItem>
          </Dropdown>
        ) : null}
        <ThemeSelector compact />
        {user ? <Button variant="ghost" onClick={() => void signOut().finally(() => router.replace('/login'))}>Sign out</Button> : null}
      </div>
    </header>
  );
}
