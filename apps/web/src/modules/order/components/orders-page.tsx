'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, EmptyState, ErrorState, PageSkeleton } from '@/components/ui';
import { customerOrderService } from '../services/customer-order.service';
import type { CustomerOrder, OrderStatus } from '../types/customer-order.types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready for pickup',
  SERVED: 'Served',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'info',
  READY: 'success',
  SERVED: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
  REFUNDED: 'danger',
};

export function OrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await customerOrderService.listOrders();
      setOrders(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (status === 'loading') return <PageSkeleton className="orders-loading" />;
  if (status === 'error') {
    return (
      <ErrorState
        title="Could not load orders"
        description="We were unable to retrieve your order history."
        action={<Button onClick={() => void load()}>Try again</Button>}
      />
    );
  }

  if (!orders.length) {
    return (
      <EmptyState
        title="No orders yet"
        description="Your order history will appear here once you place your first order."
        action={
          <Link className="button button--primary" href="/restaurants">
            Browse restaurants
          </Link>
        }
      />
    );
  }

  return (
    <div className="orders-page">
      <header className="orders-page__header">
        <p className="eyebrow">Your account</p>
        <h1>Order history</h1>
      </header>

      <ul className="orders-list" aria-label="Order history">
        {orders.map((order) => {
          const money = new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: order.restaurant.currency,
          });
          const isActive = !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status);
          return (
            <li key={order.id}>
              <Link
                className={`order-card${isActive ? ' order-card--active' : ''}`}
                href={`/orders/${order.id}`}
              >
                <div className="order-card__header">
                  <span className="order-card__number">#{order.orderNumber}</span>
                  <span
                    className={`order-card__status order-card__status--${STATUS_TONE[order.status]}`}
                  >
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <p className="order-card__restaurant">{order.restaurant.name}</p>
                <div className="order-card__meta">
                  <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                  <span className="order-card__sep">·</span>
                  <span>{order.type.replace('_', ' ').toLowerCase()}</span>
                  <span className="order-card__sep">·</span>
                  <span>{money.format(Number(order.total))}</span>
                </div>
                <time className="order-card__date" dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
                {isActive && <span className="order-card__arrow" aria-hidden>→</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
