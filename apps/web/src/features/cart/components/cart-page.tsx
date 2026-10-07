'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Separator, Skeleton } from '@restaurant/ui';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { isApiError } from '@/lib/api/errors';
import { useRestaurant } from '@/providers/restaurant-provider';
import { formatMoney } from '@/features/menu/components/menu-item-card';
import type { CartItem } from '../types';
import {
  useCurrentCart,
  useRemoveCartItem,
  useRevalidateCart,
  useUpdateCartItem,
} from '../hooks/use-cart';

export function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { restaurant, restaurantId, isLoading: isRestaurantLoading } = useRestaurant();
  const cartQuery = useCurrentCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const revalidateCart = useRevalidateCart();

  if (isAuthLoading || isRestaurantLoading || cartQuery.isLoading) return <CartLoading />;

  if (!restaurantId || !restaurant) return <CartMessage title="Restaurant unavailable" body="Choose a restaurant before viewing your cart." action="Browse restaurants" href="/" />;
  if (!isAuthenticated) return <CartMessage title="Sign in to view your cart" body="Your cart is saved securely to your customer account." action="Sign in" href="/auth" />;

  if (cartQuery.isError) {
    const error = cartQuery.error;
    const body = isApiError(error) && error.statusCode === 401
      ? 'Your session has ended. Please sign in again.'
      : isApiError(error) && error.statusCode === 409
        ? 'Your cart changed in another session. Refresh it to see the latest version.'
        : 'We could not load your cart. Please try again.';
    return <CartMessage title="Cart unavailable" body={body} action="Try again" onAction={() => void cartQuery.refetch()} />;
  }

  const cart = cartQuery.data;
  if (!cart || cart.items.length === 0) return <CartMessage title="Your cart is empty" body="Add something delicious from the menu when you are ready." action="Browse menu" href="/menu" />;

  const mutationError = updateItem.error || removeItem.error || revalidateCart.error;
  const errorMessage = mutationError && isApiError(mutationError)
    ? mutationError.statusCode === 409
      ? 'Your cart changed in another session. We refreshed it—please review the latest items.'
      : mutationError.statusCode === 401
        ? 'Your session has ended. Please sign in again.'
        : mutationError.messages[0] || 'We could not update your cart.'
    : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">{restaurant.name}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Your cart</h1>
        </div>
        <Link href="/menu" className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Continue shopping</Link>
      </div>

      {errorMessage && <p role="alert" className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{errorMessage}</p>}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label="Cart items" className="space-y-6">
          {cart.items.map((item) => (
            <CartLine
              key={item.id}
              item={item}
              currency={cart.currency}
              disabled={updateItem.isPending || removeItem.isPending}
              onDecrease={() => updateItem.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })}
              onIncrease={() => updateItem.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
              onRemove={() => removeItem.mutate({ cartItemId: item.id })}
            />
          ))}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <h2 className="text-xl font-bold">Order summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={formatMoney(cart.subtotal, cart.currency)} />
              <SummaryRow label="Tax" value={formatMoney(cart.tax, cart.currency)} />
              {Number(cart.discount) > 0 && <SummaryRow label="Discount" value={`−${formatMoney(cart.discount, cart.currency)}`} />}
              <SummaryRow label="Delivery" value="Calculated at checkout" muted />
            </dl>
            <Separator className="my-5" />
            <div className="flex items-center justify-between text-lg font-black"><span>Total</span><span>{formatMoney(cart.total, cart.currency)}</span></div>
            <Button
              className="mt-6 w-full"
              size="lg"
              isLoading={revalidateCart.isPending}
              onClick={() => revalidateCart.mutate(undefined, { onSuccess: () => router.push('/checkout') })}
            >
              Proceed to checkout
            </Button>
            <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Prices and availability are confirmed before checkout.</p>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function CartLine({ item, currency, disabled, onDecrease, onIncrease, onRemove }: { item: CartItem; currency: string; disabled: boolean; onDecrease: () => void; onIncrease: () => void; onRemove: () => void }) {
  const image = item.menuItem.media[0];
  return <article className="flex gap-4 border-b border-border pb-6 sm:gap-6">
    <div className="h-24 w-24 shrink-0 overflow-hidden bg-muted sm:h-28 sm:w-28">
      {image?.media.url ? <img src={image.media.url} alt={image.alt || item.menuItem.name} className="h-full w-full object-cover" /> : <div aria-hidden className="flex h-full items-center justify-center text-lg font-bold text-muted-foreground">{item.menuItem.name.slice(0, 1)}</div>}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">{item.menuItem.name}</h2><SelectionSummary item={item} /></div><p className="shrink-0 font-bold">{formatMoney(item.totalPrice, currency)}</p></div>
      <div className="mt-4 flex items-center justify-between gap-3"><div className="flex items-center rounded-lg border border-border"><button type="button" className="h-9 w-9 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" aria-label={`Decrease ${item.menuItem.name} quantity`} disabled={disabled || item.quantity <= 1} onClick={onDecrease}>−</button><output aria-label={`${item.menuItem.name} quantity`} className="min-w-8 text-center text-sm font-semibold">{item.quantity}</output><button type="button" className="h-9 w-9 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" aria-label={`Increase ${item.menuItem.name} quantity`} disabled={disabled || item.quantity >= 99} onClick={onIncrease}>+</button></div><button type="button" onClick={onRemove} disabled={disabled} className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-destructive hover:underline disabled:opacity-50">Remove</button></div>
    </div>
  </article>;
}

function SelectionSummary({ item }: { item: CartItem }) { const labels = [...item.variantOptions.map(({ option }) => `${option.variant.name}: ${option.name}`), ...item.addOns.map(({ addOn, quantity }) => `${quantity > 1 ? `${quantity}× ` : ''}${addOn.name}`)]; return labels.length ? <p className="mt-1 text-sm text-muted-foreground">{labels.join(' · ')}</p> : null; }
function SummaryRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) { return <div className={muted ? 'flex justify-between text-muted-foreground' : 'flex justify-between'}><dt>{label}</dt><dd>{value}</dd></div>; }
function CartMessage({ title, body, action, href, onAction }: { title: string; body: string; action: string; href?: string; onAction?: () => void }) { return <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-16 text-center"><Card className="w-full p-10"><h1 className="text-3xl font-bold">{title}</h1><p className="mt-3 text-muted-foreground">{body}</p>{href ? <Link href={href} className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{action}</Link> : <Button className="mt-6" onClick={onAction}>{action}</Button>}</Card></main>; }
function CartLoading() { return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8"><Skeleton className="h-10 w-40" /><div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]"><div className="space-y-6">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="flex gap-4"><Skeleton className="h-28 w-28" /><div className="flex-1 space-y-3"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-9 w-24" /></div></div>)}</div><Skeleton className="h-72 w-full" /></div></main>; }
