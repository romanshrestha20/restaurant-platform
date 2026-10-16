'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Button, Card, Input, Separator, Skeleton, Textarea } from '@restaurant/ui';
import { useAddresses } from '@/features/account/hooks/use-addresses';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCurrentCart } from '@/features/cart/hooks/use-cart';
import { formatMoney } from '@/features/menu/components/menu-item-card';
import { isApiError, type ApiError } from '@/lib/api/errors';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useDeliveryQuote, usePlaceOrder } from '../hooks/use-checkout';
import type { FulfilmentType } from '../types';
import { DeliveryAddressPicker, resolveDeliveryAddressId } from './delivery-address-picker';

const TIP_OPTIONS = [0, 5, 10, 15] as const;

export function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { restaurant, restaurantId, isLoading: isRestaurantLoading } = useRestaurant();
  const cartQuery = useCurrentCart();
  const addressesQuery = useAddresses();
  const placeOrder = usePlaceOrder();

  const [type, setType] = useState<FulfilmentType>('TAKEAWAY');
  const [chosenAddressId, setChosenAddressId] = useState<string | null>(null);
  const [tipPercentage, setTipPercentage] = useState<number>(0);
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');

  const addressId = type === 'DELIVERY' ? resolveDeliveryAddressId(addressesQuery.data, chosenAddressId) : null;
  const quoteQuery = useDeliveryQuote(addressId);

  if (isAuthLoading || isRestaurantLoading || cartQuery.isLoading) return <CheckoutLoading />;

  if (!restaurantId || !restaurant) {
    return <CheckoutMessage title="Restaurant unavailable" body="Choose a restaurant before checking out." action="Browse restaurants" href="/" />;
  }
  if (!isAuthenticated) {
    return <CheckoutMessage title="Sign in to check out" body="Your order is linked to your customer account." action="Sign in" href="/auth" />;
  }
  if (cartQuery.isError) {
    return <CheckoutMessage title="Checkout unavailable" body="We could not load your cart. Please try again." action="Back to cart" href="/cart" />;
  }

  const cart = cartQuery.data;
  if (!cart || cart.items.length === 0) {
    return <CheckoutMessage title="Your cart is empty" body="Add something from the menu before checking out." action="Browse menu" href="/menu" />;
  }

  const currency = cart.currency;
  const subtotal = Number(cart.subtotal);
  const quote = quoteQuery.data;
  const minimumOrder = Number(quote?.minimumOrder ?? restaurant.settings?.minimumOrder ?? 0);
  const isBelowMinimum = minimumOrder > 0 && subtotal < minimumOrder;
  const deliveryBlocked = type === 'DELIVERY' && (!addressId || quoteQuery.isLoading || quote?.deliveryAvailable !== true);
  const tipAmount = (subtotal * tipPercentage) / 100;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (isBelowMinimum || deliveryBlocked) return;
    placeOrder.mutate(
      {
        type,
        deliveryAddressId: addressId ?? undefined,
        paymentMethod: 'CASH',
        tipPercentage,
        couponCode: couponCode.trim() || undefined,
        notes: notes.trim() || null,
      },
      {
        onSuccess: (order) => {
          router.replace(`/checkout/confirmation?order=${encodeURIComponent(order.orderNumber)}`);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{restaurant.name}</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Checkout</h1>
      </div>

      <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-8">
          <Section title="How would you like your order?">
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Fulfilment">
              <ChoiceButton selected={type === 'TAKEAWAY'} onClick={() => setType('TAKEAWAY')} title="Pickup" hint={restaurant.settings?.estimatedPrepMinutes ? `Ready in about ${restaurant.settings.estimatedPrepMinutes} min` : 'Collect from the restaurant'} />
              <ChoiceButton selected={type === 'DELIVERY'} onClick={() => setType('DELIVERY')} title="Delivery" hint="Delivered to your address" />
            </div>
          </Section>

          {type === 'DELIVERY' && (
            <Section title="Delivery address">
              <DeliveryAddressPicker selectedAddressId={addressId} onSelect={setChosenAddressId} />
              <DeliveryQuoteStatus isLoading={quoteQuery.isFetching} error={quoteQuery.error} quote={quote} currency={currency} hasAddress={Boolean(addressId)} />
            </Section>
          )}

          <Section title="Payment">
            <div className="rounded-xl border border-primary bg-primary/5 p-4 text-sm">
              <p className="font-semibold">{type === 'DELIVERY' ? 'Pay on delivery' : 'Pay at pickup'}</p>
              <p className="mt-1 text-muted-foreground">Pay by cash or card when you receive your order.</p>
            </div>
          </Section>

          <Section title="Add a tip">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tip">
              {TIP_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={tipPercentage === option}
                  onClick={() => setTipPercentage(option)}
                  className={`h-10 min-w-16 rounded-xl border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tipPercentage === option ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}
                >
                  {option === 0 ? 'No tip' : `${option}%`}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Coupon and notes">
            <div className="space-y-4">
              <div>
                <label htmlFor="coupon" className="text-sm font-semibold">Coupon code</label>
                <Input id="coupon" className="mt-2 uppercase" autoComplete="off" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} />
              </div>
              <div>
                <label htmlFor="notes" className="text-sm font-semibold">Notes for the restaurant</label>
                <Textarea id="notes" className="mt-2" maxLength={500} rows={3} placeholder="Allergies, door code, anything we should know" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
            </div>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <h2 className="text-xl font-bold">Order summary</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {cart.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span><span className="font-semibold">{item.quantity}×</span> {item.menuItem.name}</span>
                  <span className="shrink-0">{formatMoney(item.totalPrice, currency)}</span>
                </li>
              ))}
            </ul>
            <Separator className="my-5" />
            <dl className="space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={formatMoney(cart.subtotal, currency)} />
              {type === 'DELIVERY' && <SummaryRow label="Delivery" value={quote?.deliveryAvailable ? formatMoney(quote.deliveryFee, currency) : '—'} />}
              {tipPercentage > 0 && <SummaryRow label={`Tip (${tipPercentage}%)`} value={formatMoney(tipAmount, currency)} />}
            </dl>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Tax, service fees and any coupon discount are confirmed when you place the order.</p>

            {isBelowMinimum && (
              <p role="alert" className="mt-4 rounded-xl bg-muted p-3 text-sm">
                The minimum order is {formatMoney(minimumOrder, currency)}. <Link href="/menu" className="font-semibold underline">Add more items</Link>.
              </p>
            )}
            {placeOrder.isError && (
              <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {checkoutErrorMessage(placeOrder.error)}
              </p>
            )}

            <Button type="submit" className="mt-6 w-full" size="lg" isLoading={placeOrder.isPending} disabled={isBelowMinimum || deliveryBlocked}>
              Place order
            </Button>
            <Link href="/cart" className="mt-3 block text-center text-sm font-semibold text-muted-foreground hover:text-foreground">Back to cart</Link>
          </Card>
        </aside>
      </form>
    </div>
  );
}

function checkoutErrorMessage(error: ApiError | Error): string {
  if (!isApiError(error)) return 'We could not place your order. Please try again.';
  if (error.statusCode === 409) return 'Your cart changed in another session. Review your cart and try again.';
  if (error.statusCode === 401) return 'Your session has ended. Please sign in again.';
  // 400s carry customer-facing validation messages (closed restaurant, coupon, minimum order, item unavailable).
  if (error.statusCode === 400 && error.messages[0]) return error.messages[0];
  return 'We could not place your order. Please try again.';
}

function DeliveryQuoteStatus({ isLoading, error, quote, currency, hasAddress }: {
  isLoading: boolean;
  error: ApiError | null;
  quote: { deliveryAvailable: boolean; deliveryFee: string; deliveryRadiusKm: string; estimatedDeliveryMinutes: number | null } | undefined;
  currency: string;
  hasAddress: boolean;
}) {
  if (!hasAddress) return null;
  if (isLoading) return <p className="mt-3 text-sm text-muted-foreground">Checking delivery to this address…</p>;
  if (error) return <p role="alert" className="mt-3 text-sm text-destructive">We could not check delivery for this address. Try another address or choose pickup.</p>;
  if (!quote) return null;
  if (!quote.deliveryAvailable) {
    return <p role="alert" className="mt-3 text-sm text-destructive">This address is outside the {Number(quote.deliveryRadiusKm)} km delivery area. Choose another address or pickup.</p>;
  }
  return (
    <p className="mt-3 text-sm text-muted-foreground">
      Delivery fee {formatMoney(quote.deliveryFee, currency)}
      {quote.estimatedDeliveryMinutes ? ` · about ${quote.estimatedDeliveryMinutes} min` : ''}
    </p>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ChoiceButton({ selected, onClick, title, hint }: { selected: boolean; onClick: () => void; title: string; hint: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
    >
      <span className="block font-semibold">{title}</span>
      <span className="mt-1 block text-sm text-muted-foreground">{hint}</span>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><dt>{label}</dt><dd>{value}</dd></div>;
}

function CheckoutMessage({ title, body, action, href }: { title: string; body: string; action: string; href: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-16 text-center">
      <Card className="w-full p-10">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{body}</p>
        <Link href={href} className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{action}</Link>
      </Card>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-48" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
