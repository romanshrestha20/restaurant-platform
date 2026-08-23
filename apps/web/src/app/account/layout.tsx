'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/modules/auth';
import { CustomerNavigation } from '@/components/customer';

const sections = [
  { label: 'Profile', href: '/account/profile', available: true },
  { label: 'Addresses', href: '/account/addresses', available: true },
  { label: 'Payment methods', href: '/account/payment-methods', available: true },
  { label: 'Favorites', href: '/account/favorites', available: true },
  { label: 'Order history', href: '/account/orders', available: true },
  { label: 'Notifications', href: '/account/notifications', available: true },
  { label: 'Preferences', href: '/account/preferences', available: true },
  { label: 'Security', href: '/account/security', available: true },
];

function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="account-app">
      <CustomerNavigation />
      <div className="account-layout">
        <aside className="account-sidebar">
          <div className="account-sidebar__heading">
            <p className="eyebrow">Account</p>
            <h1>Your space</h1>
          </div>
          <nav aria-label="Account sections">
            <ul className="account-nav">
              {sections.map((section) => (
                <li key={section.href}>
                  {section.available ? (
                    <Link
                      className={
                        pathname === section.href
                          ? 'account-nav__link is-active'
                          : 'account-nav__link'
                      }
                      href={section.href}
                      aria-current={
                        pathname === section.href ? 'page' : undefined
                      }
                    >
                      {section.label}
                    </Link>
                  ) : (
                    <span
                      className="account-nav__link is-disabled"
                      aria-disabled="true"
                    >
                      {section.label}
                      <small>Soon</small>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="mobile-section-picker">
          <label htmlFor="account-section">Account section</label>
          <select
            id="account-section"
            value={pathname}
            onChange={(event) => router.push(event.target.value)}
          >
            {sections.map((section) => (
              <option
                key={section.href}
                value={section.href}
                disabled={!section.available}
              >
                {section.label}
                {section.available ? '' : ' — Soon'}
              </option>
            ))}
          </select>
        </div>

        <main className="account-main">{children}</main>
      </div>
    </div>
  );
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AccountShell>{children}</AccountShell>
    </ProtectedRoute>
  );
}
