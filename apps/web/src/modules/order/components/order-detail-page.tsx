'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, ErrorState, PageSkeleton } from '@/components/ui';
import { customerOrderService } from '../services/customer-order.service';
import type { CustomerOrder, OrderStatus } from '../types/customer-order.types';

const STATUS_STEPS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'SERVED',
  'COMPLETED',
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  SERVED: 'Served',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const STATUS_DESCRIPTION: Record<OrderStatus, string> = {
  PENDING: 'Waiting for the restaurant to confirm your order.',
  CONFIRMED: 'Your order has been accepted and will be prepared shortly.',
  PREPARING: 'The kitchen is preparing your order.',
  READY: 'Your order is ready!',
  SERVED: 'Enjoy your meal.',
  COMPLETED: 'Your order is complete.',
  CANCELLED: 'This order has been cancelled.',
  REFUNDED: 'This order has been refunded.',
};

const TERMINAL_STATUSES: OrderStatus[] = ['COMPLETED', 'CANCELLED', 'REFUNDED'];

function OrderTracker({ status }: { status: OrderStatus }) {
  const isTerminal = TERMINAL_STATUSES.includes(status);
  const isCancelled = status === 'CANCELLED' || status === 'REFUNDED';
  const currentIndex = STATUS_STEPS.indexOf(status);

  if (isCancelled) {
    return (
      <div className="order-tracker order-tracker--cancelled">
        <div className="order-tracker__status">
          <span className="order-tracker__icon order-tracker__icon--cancelled">✕</span>
          <div>
            <strong>{STATUS_LABEL[status]}</strong>
            <p>{STATUS_DESCRIPTION[status]}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-tracker">
      <div className="order-tracker__status">
        <span className={`order-tracker__icon${isTerminal ? ' order-tracker__icon--done' : ' order-tracker__icon--active'}`}>
          {isTerminal ? '✓' : '●'}
        </span>
        <div>
          <strong>{STATUS_LABEL[status]}</strong>
          <p>{STATUS_DESCRIPTION[status]}</p>
        </div>
      </div>
      <ol className="order-tracker__steps" aria-label="Order progress">
        {STATUS_STEPS.map((step, index) => {
          const isDone = currentIndex > index;
          const isCurrent = currentIndex === index;
          return (
            <li
              key={step}
              className={`order-tracker__step${isDone ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="order-tracker__step-dot" />
              <span className="order-tracker__step-label">{STATUS_LABEL[step]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await customerOrderService.getOrder(orderId);
      setOrder(data);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [orderId]);

  // Poll every 15 seconds while the order is active
  useEffect(() => {
    void load();
    const isTerminal = order && TERMINAL_STATUSES.includes(order.status);
    if (isTerminal) return;
    const interval = setInterval(() => void load(), 15_000);
    return () => clearInterval(interval);
  }, [load, order?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading' && !order) return <PageSkeleton className="order-detail-loading" />;
  if (status === 'error' || !order) {
    return (
      <ErrorState
        title="Order not found"
        description="We could not load this order. It may not exist or may belong to another account."
        action={<Button onClick={() => void load()}>Try again</Button>}
      />
    );
  }

  const money = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: order.restaurant.currency,
  });

  const isActive = !TERMINAL_STATUSES.includes(order.status);

  return (
    <div className="order-detail">
      <header className="order-detail__header">
        <Link className="order-detail__back" href="/orders" aria-label="Back to orders">
          ←
        </Link>
        <div>
          <p className="eyebrow">Order #{order.orderNumber}</p>
          <h1>{order.restaurant.name}</h1>
        </div>
      </header>

      <div className="order-detail__layout">
        <div className="order-detail__main">
          {/* Live tracker */}
          <section className="order-detail__section">
            <OrderTracker status={order.status} />
            {isActive && (
              <p className="order-detail__refresh-note">
                Updating automatically every 15 seconds.
              </p>
            )}
          </section>

          {/* Order type / details */}
          <section className="order-detail__section">
            <h2>Order details</h2>
            <dl className="order-detail__facts">
              <div>
                <dt>Type</dt>
                <dd>{order.type.replace('_', ' ').toLowerCase()}</dd>
              </div>
              {order.table && (
                <div>
                  <dt>Table</dt>
                  <dd>#{order.table.tableNumber}</dd>
                </div>
              )}
              {order.deliveryAddress && (
                <div>
                  <dt>Delivery address</dt>
                  <dd>
                    {order.deliveryAddress.street}, {order.deliveryAddress.city}
                    {order.deliveryAddress.postalCode ? ` ${order.deliveryAddress.postalCode}` : ''}
                  </dd>
                </div>
              )}
              {order.notes && (
                <div>
                  <dt>Notes</dt>
                  <dd>{order.notes}</dd>
                </div>
              )}
              {order.payment && (
                <div>
                  <dt>Payment</dt>
                  <dd>
                    {order.payment.method.toLowerCase()} ·{' '}
                    <span className={`payment-status payment-status--${order.payment.status.toLowerCase()}`}>
                      {order.payment.status.toLowerCase()}
                    </span>
                  </dd>
                </div>
              )}
              <div>
                <dt>Placed</dt>
                <dd>
                  <time dateTime={order.createdAt}>
                    {new Date(order.createdAt).toLocaleString()}
                  </time>
                </dd>
              </div>
            </dl>
          </section>

          {/* Items */}
          <section className="order-detail__section">
            <h2>Items</h2>
            <ul className="order-detail__items">
              {order.items.map((item) => (
                <li key={item.id} className="order-detail__item">
                  <span className="order-detail__item-qty">{item.quantity}×</span>
                  <span className="order-detail__item-name">
                    {item.name}
                    {item.variantOptions.length > 0 && (
                      <small>{item.variantOptions.map((v) => v.name).join(', ')}</small>
                    )}
                    {item.addOns.length > 0 && (
                      <small>{item.addOns.map((a) => a.name).join(', ')}</small>
                    )}
                  </span>
                  <span className="order-detail__item-price">
                    {money.format(Number(item.totalPrice))}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="order-detail__totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{money.format(Number(order.subtotal))}</dd>
              </div>
              <div>
                <dt>Tax</dt>
                <dd>{money.format(Number(order.tax))}</dd>
              </div>
              {Number(order.discount) > 0 && (
                <div>
                  <dt>Discount</dt>
                  <dd>−{money.format(Number(order.discount))}</dd>
                </div>
              )}
              <div className="order-detail__total-row">
                <dt>Total</dt>
                <dd>{money.format(Number(order.total))}</dd>
              </div>
            </dl>
          </section>

          {/* Status history */}
          {order.history.length > 0 && (
            <section className="order-detail__section">
              <h2>Activity</h2>
              <ol className="order-history">
                {order.history.map((entry) => (
                  <li key={entry.id} className="order-history__entry">
                    <span className="order-history__dot" />
                    <div>
                      <strong>{STATUS_LABEL[entry.status]}</strong>
                      {entry.notes && <p>{entry.notes}</p>}
                      <time dateTime={entry.createdAt}>
                        {new Date(entry.createdAt).toLocaleString()}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
