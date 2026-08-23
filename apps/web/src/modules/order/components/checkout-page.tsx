'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Alert,
  Button,
  LoadingButton,
  PageSkeleton,
  ErrorState,
} from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { useAuth } from '@/modules/auth';
import { customerOrderService } from '../services/customer-order.service';
import { apiClient } from '@/lib/api';
import type {
  CheckoutInput,
  CustomerCart,
  OrderType,
  PaymentMethod,
} from '../types/customer-order.types';

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.messages.join(' ') : 'Something went wrong. Please try again.';

type OrderTypeOption = { value: OrderType; label: string; description: string };
const ORDER_TYPES: OrderTypeOption[] = [
  { value: 'DINE_IN', label: 'Dine In', description: 'Eat at the restaurant' },
  { value: 'TAKEAWAY', label: 'Takeaway', description: 'Collect your order' },
  { value: 'DELIVERY', label: 'Delivery', description: 'Delivered to your address' },
];

type PaymentOption = { value: PaymentMethod; label: string };
const PAYMENT_METHODS: PaymentOption[] = [
  { value: 'CARD', label: 'Pay by card' },
  { value: 'CASH', label: 'Pay with cash' },
  { value: 'ONLINE', label: 'Pay online' },
];

export function CheckoutPage() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('restaurantId') ?? '';
  const router = useRouter();
  const toast = useToast();
  const { status: authStatus } = useAuth();

  const [cart, setCart] = useState<CustomerCart | null>(null);
  const [cartStatus, setCartStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

  const [orderType, setOrderType] = useState<OrderType>('TAKEAWAY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryCountry, setDeliveryCountry] = useState('');
  const [deliveryPostal, setDeliveryPostal] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: string; label: string; street: string; city: string; postalCode: string; country: string }>>([]);
  const [deliveryAddressId, setDeliveryAddressId] = useState('');
  const [deliveryQuote, setDeliveryQuote] = useState<{ deliveryAvailable: boolean; deliveryFee: string; minimumOrder: string; estimatedDeliveryMinutes: number | null; distanceKm: number | null } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const loadCart = useCallback(async () => {
    if (!restaurantId) { setCartStatus('empty'); return; }
    setCartStatus('loading');
    try {
      const data = await customerOrderService.currentCart(restaurantId);
      if (!data || !data.items.length) { setCartStatus('empty'); return; }
      setCart(data);
      setCartStatus('ready');
    } catch {
      setCartStatus('error');
    }
  }, [restaurantId]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent('/checkout?restaurantId=' + restaurantId)}`);
      return;
    }
    if (authStatus === 'authenticated') void loadCart();
  }, [authStatus, loadCart, restaurantId, router]);
  useEffect(() => { if (authStatus === 'authenticated') void apiClient.get<typeof savedAddresses>('/profile/addresses').then(setSavedAddresses).catch(() => undefined); }, [authStatus]);
  const selectSavedAddress = (id: string) => { setDeliveryAddressId(id); setDeliveryQuote(null); const address = savedAddresses.find((entry) => entry.id === id); if (!address) return; setDeliveryStreet(address.street); setDeliveryCity(address.city); setDeliveryPostal(address.postalCode); setDeliveryCountry(address.country); void customerOrderService.deliveryQuote(restaurantId, id).then(setDeliveryQuote).catch(() => undefined); };

  const money = useMemo(() => {
    if (!cart) return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' });
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cart.currency });
  }, [cart]);

  const handleSubmit = async () => {
    if (!cart || submitting) return;
    setSubmitError('');

    if (orderType === 'DELIVERY' && (!deliveryStreet.trim() || !deliveryCity.trim() || !deliveryCountry.trim())) {
      setSubmitError('Please fill in your delivery address.');
      return;
    }
    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      setSubmitError('Please enter your table number.');
      return;
    }

    const input: CheckoutInput = {
      restaurantId,
      type: orderType,
      paymentMethod,
      notes: notes.trim() || null,
      ...(orderType === 'DINE_IN' ? { tableNumber: tableNumber.trim() } : {}),
      ...(orderType === 'DELIVERY' && deliveryAddressId ? { deliveryAddressId } : orderType === 'DELIVERY' ? {
        deliveryAddress: {
          street: deliveryStreet.trim(),
          city: deliveryCity.trim(),
          country: deliveryCountry.trim(),
          postalCode: deliveryPostal.trim() || null,
          state: null,
        },
      } : {}),
    };

    setSubmitting(true);
    try {
      const order = await customerOrderService.checkout(input);
      toast.success('Order placed!', { description: `Order #${order.orderNumber} confirmed.` });
      router.replace(`/orders/${order.id}`);
    } catch (error) {
      setSubmitError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (authStatus === 'loading' || cartStatus === 'loading') {
    return <PageSkeleton className="checkout-loading" />;
  }
  if (cartStatus === 'error') {
    return (
      <ErrorState
        title="Could not load cart"
        description="We were unable to retrieve your cart. Please go back and try again."
        action={<Button onClick={() => void loadCart()}>Try again</Button>}
      />
    );
  }
  if (cartStatus === 'empty' || !cart) {
    return (
      <div className="checkout-empty">
        <p>Your cart is empty.</p>
        <Link className="button button--primary" href="/restaurants">
          Browse restaurants
        </Link>
      </div>
    );
  }

  const restaurantName = cart.restaurant.name;

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <Link className="checkout-back" href={`/order/${cart.restaurant.slug}`} aria-label="Back to menu">
          ←
        </Link>
        <div>
          <p className="checkout-header__eyebrow">Checkout</p>
          <h1 className="checkout-header__title">{restaurantName}</h1>
        </div>
      </header>

      <div className="checkout-layout">
        {/* Left: form */}
        <div className="checkout-form">

          {/* Order type */}
          <section className="checkout-section">
            <h2>How would you like to receive your order?</h2>
            <div className="checkout-type-grid" role="radiogroup" aria-label="Order type">
              {ORDER_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  id={`order-type-${opt.value}`}
                  className={`checkout-type-card${orderType === opt.value ? ' is-selected' : ''}`}
                  role="radio"
                  aria-checked={orderType === opt.value}
                  onClick={() => setOrderType(opt.value)}
                >
                  <strong>{opt.label}</strong>
                  <span>{opt.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Table number for dine-in */}
          {orderType === 'DINE_IN' && (
            <section className="checkout-section">
              <h2>Table number</h2>
              <input
                id="checkout-table-number"
                className="checkout-input"
                type="text"
                placeholder="e.g. 7"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </section>
          )}

          {/* Delivery address */}
          {orderType === 'DELIVERY' && (
            <section className="checkout-section">
              <h2>Delivery address</h2>
              {savedAddresses.length ? <select className="checkout-input checkout-input--full" value={deliveryAddressId} onChange={(event) => selectSavedAddress(event.target.value)}><option value="">Enter a new address</option>{savedAddresses.map((address) => <option value={address.id} key={address.id}>{address.label} · {address.street}, {address.city}</option>)}</select> : null}
              {deliveryQuote ? <p className="checkout-delivery-quote">{deliveryQuote.deliveryAvailable ? <>Delivery fee: {money.format(Number(deliveryQuote.deliveryFee))} · Estimated delivery: {deliveryQuote.estimatedDeliveryMinutes} min</> : 'This restaurant does not deliver to the selected address.'}</p> : null}
              <div className="checkout-address-grid">
                <input
                  id="checkout-delivery-street"
                  className="checkout-input checkout-input--full"
                  type="text"
                  placeholder="Street address"
                  value={deliveryStreet}
                  onChange={(e) => setDeliveryStreet(e.target.value)}
                />
                <input
                  id="checkout-delivery-city"
                  className="checkout-input"
                  type="text"
                  placeholder="City"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                />
                <input
                  id="checkout-delivery-postal"
                  className="checkout-input"
                  type="text"
                  placeholder="Postal code"
                  value={deliveryPostal}
                  onChange={(e) => setDeliveryPostal(e.target.value)}
                />
                <input
                  id="checkout-delivery-country"
                  className="checkout-input"
                  type="text"
                  placeholder="Country"
                  value={deliveryCountry}
                  onChange={(e) => setDeliveryCountry(e.target.value)}
                />
              </div>
            </section>
          )}

          {/* Payment */}
          <section className="checkout-section">
            <h2>Payment method</h2>
            <div className="checkout-payment-list" role="radiogroup" aria-label="Payment method">
              {PAYMENT_METHODS.map((opt) => (
                <label
                  key={opt.value}
                  className={`checkout-payment-option${paymentMethod === opt.value ? ' is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.value}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </section>

          {/* Notes */}
          <section className="checkout-section">
            <h2>Order notes <span className="checkout-optional">(optional)</span></h2>
            <textarea
              id="checkout-notes"
              className="checkout-textarea"
              placeholder="Allergies, special preparation notes..."
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          {submitError && <Alert>{submitError}</Alert>}
        </div>

        {/* Right: order summary */}
        <aside className="checkout-summary">
          <h2>Order summary</h2>

          <ul className="checkout-summary__items">
            {cart.items.map((item) => (
              <li key={item.id} className="checkout-summary__item">
                <span className="checkout-summary__qty">{item.quantity}×</span>
                <span className="checkout-summary__name">
                  {item.menuItem.name}
                  {item.variantOptions.length > 0 && (
                    <small>{item.variantOptions.map((v) => v.option.name).join(', ')}</small>
                  )}
                  {item.addOns.length > 0 && (
                    <small>{item.addOns.map((a) => a.addOn.name).join(', ')}</small>
                  )}
                </span>
                <span className="checkout-summary__price">{money.format(Number(item.totalPrice))}</span>
              </li>
            ))}
          </ul>

          <dl className="checkout-summary__totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{money.format(Number(cart.subtotal))}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{money.format(Number(cart.tax))}</dd>
            </div>
            {Number(cart.discount) > 0 && (
              <div>
                <dt>Discount</dt>
                <dd>−{money.format(Number(cart.discount))}</dd>
              </div>
            )}
            <div className="checkout-summary__total-row">
              <dt>Total</dt>
              <dd>{money.format(Number(cart.total))}</dd>
            </div>
          </dl>

          <LoadingButton
            id="checkout-submit-btn"
            loading={submitting}
            onClick={() => void handleSubmit()}
          >
            Place order · {money.format(Number(cart.total))}
          </LoadingButton>
        </aside>
      </div>
    </div>
  );
}
