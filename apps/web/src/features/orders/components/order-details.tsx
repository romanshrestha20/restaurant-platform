'use client';

import Link from 'next/link';
import { Badge, Button, Card, Separator, Skeleton } from '@restaurant/ui';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { isApiError } from '@/lib/api/errors';
import { useOrderByNumber } from '../hooks/use-order';
import type { Order } from '../types';
import { formatEnumLabel, formatOrderDate, formatOrderStatus, formatOrderType, orderStatusBadgeVariant } from '../utils/format';
import { OrderSummary } from './order-summary';

const linkClass = 'inline-flex h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function OrderDetails({ orderNumber }: { orderNumber: string }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const orderQuery = useOrderByNumber(orderNumber);

  if (isAuthLoading || orderQuery.isLoading) return <OrderDetailsLoading />;
  if (!isAuthenticated) return <OrderMessage title="Sign in to see this order" body="Orders are saved to your customer account." action="Sign in" href="/auth" />;

  if (orderQuery.isError || !orderQuery.data) {
    const notFound = isApiError(orderQuery.error) && orderQuery.error.statusCode === 404;
    return notFound
      ? <OrderMessage title="Order not found" body="This order does not exist or was not placed with this restaurant." action="View your orders" href="/orders" />
      : <OrderMessage title="Order unavailable" body="We could not load this order. Please try again." action="Try again" onAction={() => void orderQuery.refetch()} />;
  }

  return <OrderDetailsView order={orderQuery.data} />;
}

function OrderDetailsView({ order }: { order: Order }) {
  const isDelivery = order.type === 'DELIVERY';

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground">← All orders</Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight">Order {order.orderNumber}</h1>
        <Badge variant={orderStatusBadgeVariant(order.status)}>{formatOrderStatus(order.status)}</Badge>
      </div>
      <p className="mt-2 text-muted-foreground">Placed {formatOrderDate(order.createdAt)}</p>

      <Card className="mt-8 p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Order type</dt><dd className="font-semibold">{formatOrderType(order.type)}</dd></div>
          <div>
            <dt className="text-muted-foreground">{isDelivery ? 'Delivery to' : 'Pickup at'}</dt>
            <dd className="font-semibold">{isDelivery && order.deliveryAddress ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` : order.restaurant.name}</dd>
          </div>
          {order.payment && (
            <div><dt className="text-muted-foreground">Payment</dt><dd className="font-semibold">{formatEnumLabel(order.payment.method)} · {formatEnumLabel(order.payment.status)}</dd></div>
          )}
          {order.restaurant.phone && <div><dt className="text-muted-foreground">Restaurant phone</dt><dd className="font-semibold">{order.restaurant.phone}</dd></div>}
          {order.notes && <div className="sm:col-span-2"><dt className="text-muted-foreground">Notes</dt><dd>{order.notes}</dd></div>}
        </dl>

        <Separator className="my-6" />

        <OrderSummary order={order} />
      </Card>

      {order.history.length > 0 && (
        <section aria-labelledby="order-progress" className="mt-8">
          <h2 id="order-progress" className="text-xl font-bold">Progress</h2>
          <ol className="mt-4 space-y-3 border-l border-border pl-5">
            {order.history.map((entry) => (
              <li key={entry.id} className="text-sm">
                <p className="font-semibold">{formatOrderStatus(entry.status)}</p>
                <p className="text-muted-foreground">{formatOrderDate(entry.createdAt)}</p>
                {entry.notes && <p className="mt-1">{entry.notes}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}

function OrderMessage({ title, body, action, href, onAction }: { title: string; body: string; action: string; href?: string; onAction?: () => void }) {
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

function OrderDetailsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
