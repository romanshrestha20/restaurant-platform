'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import {
  Alert,
  ErrorState,
  LoadingButton,
  PageSkeleton,
} from '@/components/ui';
import { CustomerNavigation } from '@/components/customer';
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

type OrderTypeOption = { value: OrderType; label: string; description: string; icon: string };
const ORDER_TYPES: OrderTypeOption[] = [
  { value: 'DELIVERY', label: 'Delivery', description: 'Delivered to your doorstep', icon: '🛵' },
  { value: 'TAKEAWAY', label: 'Takeaway', description: 'Pick up yourself at restaurant', icon: '🛍️' },
  { value: 'DINE_IN', label: 'Dine In', description: 'Order to your table inside', icon: '🍽️' },
];

type PaymentOption = { value: PaymentMethod; label: string; icon: string };
const PAYMENT_METHODS: PaymentOption[] = [
  { value: 'CARD', label: 'Credit or Debit Card', icon: '💳' },
  { value: 'ONLINE', label: 'Apple Pay / Google Pay', icon: '📱' },
  { value: 'CASH', label: 'Cash on Delivery', icon: '💵' },
];
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function CardPaymentForm({ onComplete }: { onComplete: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const confirm = async () => {
    if (!stripe || !elements || submitting) return;
    setSubmitting(true); setError('');
    const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}/payments/complete` }, redirect: 'if_required' });
    if (result.error) setError(result.error.message ?? 'Payment could not be completed.');
    else onComplete();
    setSubmitting(false);
  };
  return <div className="tf-card-payment-form"><PaymentElement /><p className="tf-payment-security">Your card details are encrypted and handled by Stripe.</p>{error && <Alert>{error}</Alert>}<LoadingButton loading={submitting} onClick={() => void confirm()}>Confirm payment</LoadingButton></div>;
}

export function CheckoutPage() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('restaurantId') ?? 'marlow-sage';
  const tipPercentage = Number(searchParams.get('tipPercentage') ?? '0');
  const router = useRouter();
  const toast = useToast();
  const { status: authStatus } = useAuth();

  const [cart, setCart] = useState<CustomerCart | null>(null);
  const [cartStatus, setCartStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryStreet, setDeliveryStreet] = useState('Keskustie 14 B 4');
  const [deliveryCity, setDeliveryCity] = useState('Vihti');
  const [deliveryCountry, setDeliveryCountry] = useState('Finland');
  const [deliveryPostal, setDeliveryPostal] = useState('03400');
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: string; label: string; street: string; city: string; postalCode: string; country: string }>>([]);
  const [deliveryAddressId, setDeliveryAddressId] = useState('');
  const [deliveryQuote, setDeliveryQuote] = useState<{ deliveryAvailable: boolean; deliveryFee: string; minimumOrder: string; estimatedDeliveryMinutes: number | null; distanceKm: number | null } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<{ id: string; orderNumber: string } | null>(null);

  const loadCart = useCallback(async () => {
    if (!restaurantId) { setCartStatus('empty'); return; }
    setCartStatus('loading');
    try {
      const data = await customerOrderService.currentCart(restaurantId);
      if (!data || !data.items.length) {
        setCart(null);
        setCartStatus('empty');
        return;
      }
      setCart(data);
      setCartStatus('ready');
    } catch {
      setCartStatus('error');
    }
  }, [restaurantId]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void apiClient.get<typeof savedAddresses>('/profile/addresses').then(setSavedAddresses).catch(() => undefined);
    }
  }, [authStatus]);

  const selectSavedAddress = (id: string) => {
    setDeliveryAddressId(id);
    setDeliveryQuote(null);
    const address = savedAddresses.find((entry) => entry.id === id);
    if (!address) return;
    setDeliveryStreet(address.street);
    setDeliveryCity(address.city);
    setDeliveryPostal(address.postalCode);
    setDeliveryCountry(address.country);
    void customerOrderService.deliveryQuote(restaurantId, id).then(setDeliveryQuote).catch(() => undefined);
  };

  const money = useMemo(() => {
    if (!cart) return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' });
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cart.currency || 'EUR' });
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
      tipPercentage: Number.isFinite(tipPercentage) ? tipPercentage : 0,
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
      // Create the provider intent only after the server has persisted the order total.
      const payment = paymentMethod === 'CASH' ? null : await customerOrderService.retryPayment(order.id);
      if (payment?.clientSecret && stripePublishableKey) {
        setPaymentOrder({ id: order.id, orderNumber: order.orderNumber });
        setClientSecret(payment.clientSecret);
      } else if (payment?.clientSecret && !stripePublishableKey) {
        setSubmitError('Card payments are not configured in the web app. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and try again.');
      } else {
        toast.success('Order created', { description: `We’re confirming payment for order #${order.orderNumber}.` });
        router.replace(`/orders/${order.id}`);
      }
    } catch (error) {
      setSubmitError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (cartStatus === 'loading') return <PageSkeleton className="orders-loading" />;
  if (cartStatus === 'empty' || !cart) {
    return <ErrorState title="Your cart is empty" description="Add a dish before continuing to checkout." action={<Link href="/restaurants">Browse restaurants</Link>} />;
  }

  const subtotal = Number(cart.subtotal);
  const deliveryFee = orderType === 'DELIVERY' ? 1.99 : 0;
  const serviceFee = 0.99;
  const tipAmount = (subtotal * tipPercentage) / 100;
  const total = subtotal + deliveryFee + serviceFee + tipAmount;

  return (
    <div className="tf-walkthrough-root">
      <div className="tf-container-wrapper">
        <main className="tf-app-card">
          <CustomerNavigation />

          <div className="tf-checkout-page-content">
            <header className="tf-checkout-header">
              <Link className="tf-checkout-back-link" href={cart ? `/order/${cart.restaurant?.slug || restaurantId}` : '/restaurants'}>
                ← Back to restaurant
              </Link>
              <span className="tf-hero-eyebrow">FINAL STEP</span>
              <h1 className="tf-checkout-title">Complete Checkout</h1>
              <p className="tf-checkout-subtitle">
                Ordering from <strong>{cart?.restaurant?.name || 'Marlow & Sage'}</strong>
              </p>
            </header>

            {submitError && (
              <div className="tf-checkout-alert">
                <Alert>{submitError}</Alert>
              </div>
            )}

            <div className="tf-checkout-grid">
              {/* Left Column: Form Details */}
              <div className="tf-checkout-form-column">
                {/* 1. Fulfillment Type */}
                <section className="tf-checkout-card">
                  <h2 className="tf-card-section-title">1. How would you like your order?</h2>
                  <div className="tf-type-selector-grid">
                    {ORDER_TYPES.map((opt) => {
                      const isSelected = orderType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`tf-type-option-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setOrderType(opt.value)}
                        >
                          <span className="tf-type-icon">{opt.icon}</span>
                          <div>
                            <strong>{opt.label}</strong>
                            <small>{opt.description}</small>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 2. Address or Table Details */}
                {orderType === 'DELIVERY' && (
                  <section className="tf-checkout-card">
                    <h2 className="tf-card-section-title">2. Delivery Address</h2>
                    {savedAddresses.length > 0 && (
                      <div className="tf-saved-addresses-select">
                        <label>Choose a saved address</label>
                        <select
                          className="tf-input-field"
                          value={deliveryAddressId}
                          onChange={(e) => selectSavedAddress(e.target.value)}
                        >
                          <option value="">Enter a new address</option>
                          {savedAddresses.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.label} — {a.street}, {a.city}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {deliveryQuote && (
                      <p className="checkout-delivery-quote">
                        {deliveryQuote.deliveryAvailable
                          ? `Delivery fee: ${money.format(Number(deliveryQuote.deliveryFee))} · Estimated delivery: ${deliveryQuote.estimatedDeliveryMinutes ?? 25} min`
                          : 'This restaurant does not deliver to the selected address.'}
                      </p>
                    )}

                    <div className="tf-address-fields-grid">
                      <div className="tf-field is-full">
                        <label>Street Address</label>
                        <input
                          type="text"
                          className="tf-input-field"
                          placeholder="e.g. Keskustie 14 B 4"
                          value={deliveryStreet}
                          onChange={(e) => setDeliveryStreet(e.target.value)}
                        />
                      </div>
                      <div className="tf-field">
                        <label>City</label>
                        <input
                          type="text"
                          className="tf-input-field"
                          placeholder="City"
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                        />
                      </div>
                      <div className="tf-field">
                        <label>Postal Code</label>
                        <input
                          type="text"
                          className="tf-input-field"
                          placeholder="Postal code"
                          value={deliveryPostal}
                          onChange={(e) => setDeliveryPostal(e.target.value)}
                        />
                      </div>
                    </div>
                  </section>
                )}

                {orderType === 'DINE_IN' && (
                  <section className="tf-checkout-card">
                    <h2 className="tf-card-section-title">2. Table Number</h2>
                    <div className="tf-field">
                      <label>Enter table number printed on your table</label>
                      <input
                        type="text"
                        className="tf-input-field"
                        placeholder="e.g. Table 8"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                      />
                    </div>
                  </section>
                )}

                {/* 3. Payment Method */}
                <section className="tf-checkout-card">
                  <h2 className="tf-card-section-title">3. Payment Method</h2>
                  <div className="tf-payment-methods-list">
                    {PAYMENT_METHODS.map((pm) => {
                      const isSelected = paymentMethod === pm.value;
                      return (
                        <label
                          key={pm.value}
                          className={`tf-payment-method-row ${isSelected ? 'is-selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={isSelected}
                            onChange={() => setPaymentMethod(pm.value)}
                          />
                          <span className="tf-payment-icon">{pm.icon}</span>
                          <span className="tf-payment-name">{pm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {clientSecret && <Elements stripe={stripePromise} options={{ clientSecret }}><CardPaymentForm onComplete={() => paymentOrder && router.replace(`/orders/${paymentOrder.id}`)} /></Elements>}
                </section>

                {/* 4. Notes */}
                <section className="tf-checkout-card">
                  <h2 className="tf-card-section-title">4. Order Notes</h2>
                  <textarea
                    rows={2}
                    className="tf-notes-textarea"
                    placeholder="Gate code, door buzz instructions, or food allergy notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </section>
              </div>

              {/* Right Column: Order Summary & Place Order */}
              <div className="tf-checkout-summary-column">
                <div className="tf-checkout-summary-card">
                  <h2 className="tf-summary-heading">Order summary</h2>

                  <div className="tf-summary-items-list">
                    {cart?.items?.map((item) => (
                      <div key={item.id} className="tf-summary-item-row">
                        <div className="tf-summary-item-left">
                          <span className="tf-summary-item-qty">{item.quantity}x</span>
                          <span className="tf-summary-item-name">{item.menuItem.name}</span>
                        </div>
                        <span className="tf-summary-item-price">
                          {money.format(Number(item.totalPrice || item.unitPrice))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="tf-summary-divider" />

                  <div className="tf-summary-breakdown">
                    <div className="tf-summary-row">
                      <span>Subtotal</span>
                      <span>{money.format(subtotal)}</span>
                    </div>
                    {orderType === 'DELIVERY' && (
                      <div className="tf-summary-row">
                        <span>Standard delivery</span>
                        <span>{money.format(deliveryFee)}</span>
                      </div>
                    )}
                    <div className="tf-summary-row">
                      <span>Service fee</span>
                      <span>{money.format(serviceFee)}</span>
                    </div>
                    {tipAmount > 0 && <div className="tf-summary-row"><span>Courier tip ({tipPercentage}%)</span><span>{money.format(tipAmount)}</span></div>}
                    <div className="tf-summary-divider" />
                    <div className="tf-summary-row is-total">
                      <span>Total to pay</span>
                      <strong className="tf-total-amount">{money.format(total)}</strong>
                    </div>
                  </div>

                  <LoadingButton
                    loading={submitting}
                    onClick={handleSubmit}
                    className="tf-checkout-place-order-btn"
                  >
                    Pay {money.format(total)}
                  </LoadingButton>

                  <p className="tf-checkout-terms-note">
                    Payment is confirmed securely by our payment provider. Your order is sent to the restaurant only after confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
