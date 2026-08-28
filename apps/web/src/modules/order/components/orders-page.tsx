'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, ErrorState, PageSkeleton } from '@/components/ui';
import { CustomerNavigation } from '@/components/customer';
import { customerOrderService } from '../services/customer-order.service';
import type { CustomerOrder, OrderStatus } from '../types/customer-order.types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pending Confirmation',
  CONFIRMED: 'Order Confirmed',
  PREPARING: 'Kitchen Preparing',
  READY: 'Ready for delivery/pickup',
  SERVED: 'Delivered',
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

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'loading') return <PageSkeleton className="orders-loading" />;

  return (
    <div className="tf-walkthrough-root">
      <div className="tf-container-wrapper">
        <main className="tf-app-card">
          <CustomerNavigation />

          <div className="tf-orders-page-content">
            <header className="tf-orders-header">
              <span className="tf-hero-eyebrow">YOUR ACCOUNT</span>
              <h1 className="tf-orders-title">Past & Active Orders</h1>
            </header>

            {status === 'error' ? (
              <ErrorState
                title="Could not load orders"
                description="We were unable to retrieve your order history."
                action={<Button onClick={() => void load()}>Try again</Button>}
              />
            ) : !orders.length ? (
              <div className="tf-orders-empty">
                <div className="tf-orders-empty-icon">🧾</div>
                <h2>No orders placed yet</h2>
                <p>When you place an order with any restaurant, you can track it in real time here.</p>
                <Link className="tf-btn-primary" href="/restaurants">
                  Browse restaurants
                </Link>
              </div>
            ) : (
              <ul className="tf-orders-list" aria-label="Order history">
                {orders.map((order) => {
                  const money = new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: order.currency || order.restaurant?.currency || 'EUR',
                  });
                  const isActive = !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status);
                  return (
                    <li key={order.id} className="tf-order-item">
                      <Link
                        className={`tf-order-card ${isActive ? 'is-active-order' : ''}`}
                        href={`/orders/${order.id}`}
                      >
                        <div className="tf-order-card__header">
                          <span className="tf-order-card__number">Order #{order.orderNumber}</span>
                          <span className={`tf-order-badge is-${STATUS_TONE[order.status]}`}>
                            {STATUS_LABEL[order.status]}
                          </span>
                        </div>

                        <h3 className="tf-order-card__restaurant">
                          {order.restaurant?.name || 'Restaurant'}
                        </h3>

                        <div className="tf-order-card__meta">
                          <span>{order.items?.length || 1} item{(order.items?.length || 1) !== 1 ? 's' : ''}</span>
                          <span className="tf-dot">·</span>
                          <span>{order.type?.replace('_', ' ').toLowerCase() || 'delivery'}</span>
                          <span className="tf-dot">·</span>
                          <strong>{money.format(Number(order.total))}</strong>
                        </div>

                        <div className="tf-order-card__footer">
                          <time dateTime={order.createdAt || (order as any).placedAt}>
                            {new Date(order.createdAt || (order as any).placedAt || Date.now()).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                          <span className="tf-order-view-link">View tracking details →</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
