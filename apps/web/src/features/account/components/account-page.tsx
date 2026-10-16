'use client';

import Link from 'next/link';
import { Badge, Button, Card, Skeleton } from '@restaurant/ui';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useAddresses } from '../hooks/use-addresses';

export function AccountPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const addresses = useAddresses();

  if (isAuthLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Card className="p-8">
          <h1 className="text-2xl font-bold">Sign in to view your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your details and saved addresses.
          </p>
          <Link
            href="/auth"
            className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Sign in
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Account</h1>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="font-semibold">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/orders"
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            My orders
          </Link>
          <Button variant="outline" size="sm" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </Card>

      <section aria-labelledby="addresses-heading">
        <h2 id="addresses-heading" className="mb-3 text-xl font-bold">
          Saved addresses
        </h2>
        {addresses.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : addresses.isError ? (
          <Card className="p-5 text-sm">
            <p className="text-muted-foreground">We could not load your addresses.</p>
            <Button className="mt-3" size="sm" onClick={() => void addresses.refetch()}>
              Try again
            </Button>
          </Card>
        ) : !addresses.data?.length ? (
          <Card className="border-dashed p-5 text-sm text-muted-foreground">
            No saved addresses yet. You can add one during checkout.
          </Card>
        ) : (
          <ul className="space-y-3">
            {addresses.data.map((address) => (
              <li key={address.id}>
                <Card className="flex items-start justify-between gap-3 p-4">
                  <div className="text-sm">
                    <p className="font-semibold">{address.label}</p>
                    <p className="text-muted-foreground">
                      {address.street}, {address.postalCode} {address.city}
                    </p>
                  </div>
                  {address.isDefault && <Badge variant="secondary">Default</Badge>}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
