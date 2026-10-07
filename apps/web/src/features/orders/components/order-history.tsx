'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge, Button, Card, Skeleton } from '@restaurant/ui';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { formatMoney } from '@/features/menu/components/menu-item-card';
import { isApiError } from '@/lib/api/errors';
import { useRestaurant } from '@/providers/restaurant-provider';
import { ORDERS_PAGE_SIZE, useCustomerOrders } from '../hooks/use-order';
import type { Order } from '../types';
import { formatOrderDate, formatOrderStatus, formatOrderType, orderStatusBadgeVariant } from '../utils/format';

const linkClass = 'inline-flex h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function OrderHistory() {
  const [page, setPage] = useState(0);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { restaurant, restaurantId, isLoading: isRestaurantLoading } = useRestaurant();
  const ordersQuery = useCustomerOrders(page);

  if (isAuthLoading || isRestaurantLoading || ordersQuery.isLoading) return <OrderHistoryLoading />;

  if (!restaurantId || !restaurant) return <OrdersMessage title="Restaurant unavailable" body="Choose a restaurant to see your orders." action="Browse restaurants" href="/" />;
  if (!isAuthenticated) return <OrdersMessage title="Sign in to see your orders" body="Your order history is saved to your customer account." action="Sign in" href="/auth" />;

  if (ordersQuery.isError) {
    const body = isApiError(ordersQuery.error) && ordersQuery.error.statusCode === 401
      ? 'Your session has ended. Please sign in again.'
      : 'We could not load your orders. Please try again.';
    return <OrdersMessage title="Orders unavailable" body={body} action="Try again" onAction={() => void ordersQuery.refetch()} />;
  }

  const list = ordersQuery.data;
  if (!list || list.total === 0) return <OrdersMessage title="No orders yet" body={`Orders you place with ${restaurant.name} will appear here.`} action="Browse menu" href="/menu" />;

  const pageCount = Math.ceil(list.total / ORDERS_PAGE_SIZE);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{restaurant.name}</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Your orders</h1>

      <ul className={`mt-8 space-y-4 transition-opacity ${ordersQuery.isPlaceholderData ? 'opacity-60' : ''}`} aria-busy={ordersQuery.isFetching}>
        {list.items.map((order) => <OrderRow key={order.id} order={order} />)}
      </ul>

      {pageCount > 1 && (
        <nav aria-label="Order pages" className="mt-8 flex items-center justify-between gap-4">
          <Button variant="outline" disabled={page === 0 || ordersQuery.isPlaceholderData} onClick={() => setPage((current) => current - 1)}>Newer</Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} of {pageCount}</span>
          <Button variant="outline" disabled={page + 1 >= pageCount || ordersQuery.isPlaceholderData} onClick={() => setPage((current) => current + 1)}>Older</Button>
        </nav>
      )}
    </main>
  );
}

function OrderRow({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <li>
      <Link
        href={`/orders/${encodeURIComponent(order.orderNumber)}`}
        className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/50">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{order.orderNumber}</span>
              <Badge variant={orderStatusBadgeVariant(order.status)}>{formatOrderStatus(order.status)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatOrderDate(order.createdAt)} · {formatOrderType(order.type)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
          </div>
          <span className="font-bold">{formatMoney(order.total, order.restaurant.currency)}</span>
        </Card>
      </Link>
    </li>
  );
}

function OrdersMessage({ title, body, action, href, onAction }: { title: string; body: string; action: string; href?: string; onAction?: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-16 text-center">
      <Card className="w-full p-10">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{body}</p>
        {href
          ? <Link href={href} className={`${linkClass} mt-6 bg-primary text-primary-foreground hover:opacity-90`}>{action}</Link>
          : <Button className="mt-6" onClick={onAction}>{action}</Button>}
      </Card>
    </div>
  );
}

function OrderHistoryLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">
      <Skeleton className="h-10 w-56" />
      {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-24 w-full" />)}
    </div>
  );
}
