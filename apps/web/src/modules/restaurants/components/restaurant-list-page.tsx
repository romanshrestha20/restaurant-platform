'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Badge,
  Button,
  ErrorState,
  PageHeader,
  PageSkeleton,
} from '@/components/ui';
import { useAuth } from '@/modules/auth';
import { useActiveRestaurant } from '../context/active-restaurant-context';
import { RestaurantAvatar } from './restaurant-avatar';

const roleLabels = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  CHEF: 'Chef',
  WAITER: 'Waiter',
} as const;

export function RestaurantListPage() {
  const { refresh, memberships, status } = useActiveRestaurant();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'ready' && memberships.length === 1) {
      router.replace(`/restaurants/${memberships[0]?.restaurant.id}`);
    }
  }, [memberships, router, status]);

  if (
    status === 'loading' ||
    (status === 'ready' && memberships.length === 1)
  ) {
    return (
      <PageSkeleton className="workspace-selector workspace-selector--loading" />
    );
  }

  if (status === 'error') {
    return (
      <ErrorState
        action={
          <Button onClick={() => void refresh().catch(() => undefined)}>
            Try again
          </Button>
        }
        description="We could not load your restaurant workspaces."
        title="Restaurants unavailable"
      />
    );
  }

  return (
    <div className="workspace-selector">
      <PageHeader
        className="workspace-selector__heading"
        description={
          memberships.length
            ? 'Select the workspace you want to operate.'
            : 'Your account is ready. Add a restaurant to begin.'
        }
        eyebrow={`Welcome back, ${user?.profile?.firstName ?? 'there'}`}
        title={
          memberships.length
            ? 'Choose a restaurant'
            : 'Create your first restaurant'
        }
      />

      {memberships.length ? (
        <section
          className="workspace-selector__grid"
          aria-label="Restaurant workspaces"
        >
          {memberships.map(({ callerRole, restaurant }, index) => {
            const logo = restaurant.media.find((item) => item.type === 'LOGO');
            const address = restaurant.addresses[0];
            return (
              <Link
                className="workspace-tile"
                href={`/restaurants/${restaurant.id}`}
                key={restaurant.id}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <RestaurantAvatar
                  className="workspace-tile__logo"
                  logoUrl={logo?.media.url}
                  name={restaurant.name}
                  size="lg"
                />
                <span className="workspace-tile__identity">
                  <strong>{restaurant.name}</strong>
                  <small>
                    {address
                      ? `${address.city}, ${address.country}`
                      : 'Location pending'}
                  </small>
                </span>
                <span className="workspace-tile__meta">
                  <span>{roleLabels[callerRole]}</span>
                  <Badge
                    tone={
                      restaurant.status === 'ACTIVE' ? 'success' : 'warning'
                    }
                  >
                    {restaurant.status.toLowerCase()}
                  </Badge>
                </span>
                <span className="workspace-tile__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            );
          })}
          <Link
            className="workspace-tile workspace-tile--create"
            href="/restaurants/new"
          >
            <span className="workspace-tile__add" aria-hidden="true">
              +
            </span>
            <span>
              <strong>Create restaurant</strong>
              <small>Start another workspace</small>
            </span>
          </Link>
        </section>
      ) : (
        <Link
          className="button button--primary workspace-selector__create"
          href="/restaurants/new"
        >
          Create restaurant
        </Link>
      )}

      <footer className="workspace-selector__footer">
        <Link href="/account/profile">Personal account</Link>
        <span>One account, multiple workspaces.</span>
      </footer>
    </div>
  );
}
