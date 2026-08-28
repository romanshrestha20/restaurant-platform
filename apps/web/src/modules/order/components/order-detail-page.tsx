'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, ErrorState, LoadingButton, PageSkeleton } from '@/components/ui';
import { CustomerNavigation } from '@/components/customer';
import { customerOrderService } from '../services/customer-order.service';
import type { CustomerOrder, OrderStatus, PaymentStatus } from '../types/customer-order.types';

const STATUS_STEPS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'SERVED',
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Order Confirmed',
  PREPARING: 'Kitchen Preparing Dishes',
  READY: 'Courier on the Way / Ready',
  SERVED: 'Order Delivered',
  COMPLETED: 'Order Complete',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

const STATUS_DESCRIPTION: Record<OrderStatus, string> = {
  PENDING: 'We received your order and sent it directly to the kitchen.',
  CONFIRMED: 'The restaurant confirmed your order and started prep.',
  PREPARING: 'Your meal is being freshly cooked right now.',
  READY: 'Food is packed and headed your way.',
  SERVED: 'Enjoy your meal!',
  COMPLETED: 'Thank you for ordering with Tablefolk.',
  CANCELLED: 'This order has been cancelled.',
  REFUNDED: 'Payment refunded to original method.',
};

function trackerLabels(type: CustomerOrder['type']): Record<OrderStatus, string> {
  if (type === 'TAKEAWAY') return { ...STATUS_LABEL, READY: 'Ready for pickup', SERVED: 'Picked up', COMPLETED: 'Picked up' };
  if (type === 'DINE_IN') return { ...STATUS_LABEL, READY: 'Ready', SERVED: 'Served', COMPLETED: 'Completed' };
  return { ...STATUS_LABEL, READY: 'Ready', SERVED: 'Delivered', COMPLETED: 'Delivered' };
}

const TERMINAL_STATUSES: OrderStatus[] = ['COMPLETED', 'CANCELLED', 'REFUNDED', 'SERVED'];

function PaymentNotice({ order, currency, onRetry }: { order: CustomerOrder; currency: string; onRetry: () => Promise<void> }) {
  const [retrying, setRetrying] = useState(false);
  const payment = order.payment;
  if (!payment) return null;
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency });
  const labels: Record<PaymentStatus, string> = { PENDING: 'Payment is being confirmed', PROCESSING: 'Payment is processing', PAID: 'Paid', FAILED: 'Payment failed', CANCELLED: 'Payment cancelled', REFUND_PENDING: 'Refund requested', PARTIALLY_REFUNDED: 'Partially refunded', REFUNDED: 'Refunded' };
  const retry = async () => { setRetrying(true); try { await onRetry(); } finally { setRetrying(false); } };
  return <section className={`tf-payment-notice is-${payment.status.toLowerCase()}`}>
    <div><span className="tf-hero-eyebrow">PAYMENT</span><strong>{labels[payment.status]}</strong><span>{money.format(Number(payment.amount))}</span></div>
    {(payment.status === 'PENDING' || payment.status === 'PROCESSING') && <p>We’re waiting for the provider’s confirmation. This page will update automatically.</p>}
    {payment.status === 'FAILED' && <><p>We couldn’t complete your payment. Your order has not been charged.</p><LoadingButton loading={retrying} onClick={() => void retry()}>Try payment again</LoadingButton></>}
    {payment.status === 'REFUNDED' && <p>Your refund has been initiated and will appear with your provider shortly.</p>}
  </section>;
}

function OrderTracker({ status, type }: { status: OrderStatus; type: CustomerOrder['type'] }) {
  const labels = trackerLabels(type);
  const isCancelled = status === 'CANCELLED' || status === 'REFUNDED';

  if (isCancelled) {
    return (
      <div className="tf-tracker-cancelled">
        <span className="tf-tracker-icon is-cancelled">✕</span>
        <div>
        <h3 className="tf-tracker-title">{labels[status]}</h3>
          <p className="tf-tracker-desc">{STATUS_DESCRIPTION[status]}</p>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(status === 'COMPLETED' ? 'SERVED' : status);
  return (
    <div className="tf-order-tracker">
      <div className="tf-tracker-current">
        <div className="tf-tracker-pulse-wrap">
          <span className="tf-tracker-pulse" />
          <span className="tf-tracker-dot" />
        </div>
        <div>
        <h3 className="tf-tracker-title">{labels[status]}</h3>
          <p className="tf-tracker-desc">{STATUS_DESCRIPTION[status]}</p>
        </div>
      </div>

      <ol className="tf-tracker-steps" aria-label="Order progress">
        {STATUS_STEPS.map((step, index) => {
          const isDone = currentIndex > index || status === 'COMPLETED' || status === 'SERVED';
          const isCurrent = currentIndex === index && status !== 'COMPLETED' && status !== 'SERVED';
          return (
            <li
              key={step}
              className={`tf-tracker-step ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
            >
              <div className="tf-step-icon">
                {isDone ? '✓' : index + 1}
              </div>
              <span className="tf-step-label">{labels[step]}</span>
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

  useEffect(() => {
    void load();
    const interval = setInterval(() => {
      if (order && !TERMINAL_STATUSES.includes(order.status)) {
        void load();
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [load, order]);

  if (status === 'loading' && !order) return <PageSkeleton className="orders-loading" />;
  if (status === 'error' || !order) {
    return (
      <div className="tf-walkthrough-root">
        <div className="tf-container-wrapper">
          <main className="tf-app-card">
            <CustomerNavigation />
            <div className="tf-orders-page-content">
              <ErrorState
                title="Order not found"
                description="We could not load this order. It may belong to another session."
                action={<Button onClick={() => void load()}>Try again</Button>}
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  const currency = order.currency || order.restaurant?.currency || 'EUR';
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency });
  const isActive = !TERMINAL_STATUSES.includes(order.status);
  const refreshAfterRetry = async () => { await customerOrderService.retryPayment(order.id); await load(); };

  return (
    <div className="tf-walkthrough-root">
      <div className="tf-container-wrapper">
        <main className="tf-app-card">
          <CustomerNavigation />

          <div className="tf-tracking-page-content">
            <header className="tf-tracking-header">
              <Link className="tf-tracking-back-btn" href="/orders">
                ← Back to all orders
              </Link>
              <div className="tf-tracking-title-row">
                <div>
                  <span className="tf-hero-eyebrow">LIVE TRACKING</span>
                  <h1 className="tf-tracking-title">Order #{order.orderNumber}</h1>
                </div>
                <div className="tf-tracking-restaurant-pill">
                  <span>{order.restaurant?.name || 'Tablefolk Kitchen'}</span>
                </div>
              </div>
            </header>

            <div className="tf-tracking-grid">
              {/* Left Column: Tracker & Map simulation */}
              <div className="tf-tracking-main">
                <section className="tf-tracking-card">
                  <OrderTracker status={order.status} type={order.type} />
                  <PaymentNotice order={order} currency={currency} onRetry={refreshAfterRetry} />

                  {isActive && (
                    <div className="tf-eta-banner">
                      <div className="tf-eta-icon">⏱️</div>
                      <div>
                        <span className="tf-eta-label">Estimated Delivery Arrival</span>
                        <strong className="tf-eta-time">
                          ~{(order as any).estimatedDeliveryMinutes || 25} minutes
                        </strong>
                      </div>
                    </div>
                  )}
                </section>

                {/* Simulated Delivery Map Visual */}
                <section className="tf-map-card">
                  {order.type !== 'DELIVERY' || !['READY', 'SERVED', 'COMPLETED'].includes(order.status) ? (
                    <div className="tf-delivery-waiting"><span className="tf-hero-eyebrow">DELIVERY</span><h2>{order.type === 'TAKEAWAY' ? 'Ready for pickup soon' : 'Your order is being prepared'}</h2><p>{order.type === 'DELIVERY' ? "We'll show courier tracking once your order is on the way." : 'We’ll update this page when your order is ready.'}</p></div>
                  ) : (
                  <>
                  <div className="tf-map-visual">
                    <div className="tf-map-grid-bg" />
                    <div className="tf-map-route-line" />
                    <div className="tf-map-marker-restaurant">
                      <span>🍴</span>
                      <small>{order.restaurant?.name || 'Kitchen'}</small>
                    </div>
                    <div className="tf-map-marker-courier">
                      <span>🛵</span>
                      <small>Courier</small>
                    </div>
                    <div className="tf-map-marker-home">
                      <span>📍</span>
                      <small>You</small>
                    </div>
                  </div>
                  <div className="tf-map-info-bar">
                    <span>Delivering to: <strong>{order.deliveryAddress ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` : 'Vihti, Uusimaa'}</strong></span>
                  </div>
                  </>
                  )}
                </section>
              </div>

              {/* Right Column: Receipt Breakdown */}
              <div className="tf-tracking-sidebar">
                <div className="tf-receipt-card">
                  <h2 className="tf-receipt-heading">Receipt & Items</h2>

                  <div className="tf-receipt-items">
                    {order.items?.map((item, idx) => (
                      <div key={item.id || idx} className="tf-receipt-row">
                        <div className="tf-receipt-item-info">
                          <span className="tf-receipt-qty">{item.quantity}x</span>
                          <div>
                            <strong className="tf-receipt-item-name">{item.name}</strong>
                            {item.notes && <p className="tf-receipt-note">“{item.notes}”</p>}
                          </div>
                        </div>
                        <span className="tf-receipt-price">
                          {money.format(Number(item.totalPrice || item.unitPrice))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="tf-receipt-divider" />

                  <div className="tf-receipt-totals">
                    <div className="tf-receipt-line">
                      <span>Subtotal</span>
                      <span>{money.format(Number(order.subtotal || '0.00'))}</span>
                    </div>
                    <div className="tf-receipt-line">
                      <span>Delivery Fee</span>
                      <span>{money.format(Number((order as any).deliveryFee || '1.99'))}</span>
                    </div>
                    <div className="tf-receipt-line"><span>Service fee</span><span>{money.format(Number((order as any).serviceFee || '0.00'))}</span></div>
                    {Number(order.tip || 0) > 0 && <div className="tf-receipt-line"><span>Courier tip</span><span>{money.format(Number(order.tip))}</span></div>}
                    <div className="tf-receipt-line is-total">
                      <span>Total Paid</span>
                      <strong>{money.format(Number(order.total || '0.00'))}</strong>
                    </div>
                  </div>

                  <div className="tf-receipt-actions">
                    <Link href={`/order/${order.restaurant?.slug || 'marlow-sage'}`} className="tf-btn-secondary">
                      Order again from this place
                    </Link>
                    <Link href="/restaurants" className="tf-btn-outline">
                      Explore other restaurants
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
