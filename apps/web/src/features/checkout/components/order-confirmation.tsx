'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, Separator, Skeleton } from '@restaurant/ui';
import { OrderSummary } from '@/features/orders/components/order-summary';
import { useOrderByNumber } from '@/features/orders/hooks/use-order';
import type { Order } from '@/features/orders/types';
import { formatOrderStatus } from '@/features/orders/utils/format';
import { isApiError } from '@/lib/api/errors';

const linkClass = 'inline-flex h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function OrderConfirmation() {
  const orderNumber = useSearchParams().get('order');
  const orderQuery = useOrderByNumber(orderNumber);

  if (!orderNumber) {
    return <ConfirmationMessage title="Order not found" body="We could not tell which order to show." />;
  }
  if (orderQuery.isLoading) return <ConfirmationLoading />;
  if (orderQuery.isError || !orderQuery.data) {
    const notFound = isApiError(orderQuery.error) && orderQuery.error.statusCode === 404;
    return (
      <ConfirmationMessage
        title={notFound ? 'Order not found' : 'Order unavailable'}
        body={notFound ? 'This order does not exist or belongs to another account.' : 'We could not load your order. Please refresh the page.'}
      />
    );
  }

  return <ConfirmationDetails order={orderQuery.data} />;
}

function ConfirmationDetails({ order }: { order: Order }) {
  const isDelivery = order.type === 'DELIVERY';

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{order.restaurant.name}</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Thank you for your order</h1>
        <p className="mt-3 text-muted-foreground">
          Order <span className="font-semibold text-foreground">{order.orderNumber}</span> has been sent to the restaurant.
          {order.status === 'PENDING' ? ' You will see it here once it is confirmed.' : ''}
        </p>
      </div>

      <Card className="mt-10 p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Status</dt><dd className="font-semibold">{formatOrderStatus(order.status)}</dd></div>
          <div><dt className="text-muted-foreground">{isDelivery ? 'Delivery to' : 'Pickup'}</dt><dd className="font-semibold">{isDelivery && order.deliveryAddress ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` : order.restaurant.name}</dd></div>
          <div><dt className="text-muted-foreground">Payment</dt><dd className="font-semibold">{isDelivery ? 'Pay on delivery' : 'Pay at pickup'}</dd></div>
          {order.restaurant.phone && <div><dt className="text-muted-foreground">Restaurant phone</dt><dd className="font-semibold">{order.restaurant.phone}</dd></div>}
        </dl>

        <Separator className="my-6" />

        <OrderSummary order={order} />
      </Card>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/orders/${encodeURIComponent(order.orderNumber)}`} className={`${linkClass} bg-primary text-primary-foreground hover:opacity-90`}>Track this order</Link>
        <Link href="/menu" className={`${linkClass} border border-border bg-background hover:bg-muted`}>Back to menu</Link>
      </div>
    </div>
  );
}

function ConfirmationMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-16 text-center">
      <Card className="w-full p-10">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{body}</p>
        <Link href="/menu" className={`${linkClass} mt-6 bg-primary text-primary-foreground hover:opacity-90`}>Back to menu</Link>
      </Card>
    </div>
  );
}

function ConfirmationLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:px-6">
      <Skeleton className="mx-auto h-10 w-72" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
