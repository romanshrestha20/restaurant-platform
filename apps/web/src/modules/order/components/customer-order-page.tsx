'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  LoadingButton,
  Modal,
  PageSkeleton,
  Textarea,
} from '@/components/ui';
import { ApiError } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { useAuth } from '@/modules/auth';
import { customerOrderService } from '../services/customer-order.service';
import type {
  CatalogItem,
  CustomerCart,
  CustomerCatalog,
} from '../types/customer-order.types';

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.messages.join(' ') : 'Please try again.';

export function CustomerOrderPage({ slug }: { slug: string }) {
  const [catalog, setCatalog] = useState<CustomerCatalog | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [activeMenu, setActiveMenu] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [cart, setCart] = useState<CustomerCart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartPending, setCartPending] = useState(false);
  const { status: authStatus } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const loadCatalog = useCallback(async () => {
    setStatus('loading');
    try {
      const next = await customerOrderService.catalog(slug);
      setCatalog(next);
      setActiveMenu(next.menus[0]?.id ?? '');
      setActiveCategory(next.menus[0]?.categories[0]?.id ?? '');
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [slug]);

  useEffect(() => { void loadCatalog(); }, [loadCatalog]);
  useEffect(() => {
    if (authStatus !== 'authenticated' || !catalog) {
      if (authStatus === 'unauthenticated') setCart(null);
      return;
    }
    void customerOrderService.currentCart(catalog.id).then(setCart).catch(() => undefined);
  }, [authStatus, catalog]);

  useEffect(() => {
    if (!cart || authStatus !== 'authenticated') return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void customerOrderService.revalidate(cart.id, cart.version)
          .then(({ cart: next, changes }) => {
            setCart(next);
            if (changes.length) toast.info('Your cart was updated with current menu prices');
          })
          .catch(() => undefined);
      }, 250);
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [authStatus, cart?.id, cart?.version, toast]);

  const menu = catalog?.menus.find((entry) => entry.id === activeMenu) ?? catalog?.menus[0];
  const categories = menu?.categories ?? [];
  const visibleCategories = activeCategory
    ? categories.filter((entry) => entry.id === activeCategory)
    : categories;
  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

  const addToCart = async (input: {
    item: CatalogItem;
    quantity: number;
    variantOptionIds: string[];
    addOns: Array<{ addOnId: string; quantity: number }>;
    notes: string | null;
  }) => {
    if (!catalog) return;
    if (authStatus !== 'authenticated') {
      router.push(`/login?next=${encodeURIComponent(`/order/${slug}`)}`);
      return;
    }
    setCartPending(true);
    try {
      const activeCart = cart ?? (await customerOrderService.createCart(catalog.id));
      const next = await customerOrderService.addItem(activeCart.id, {
        menuItemId: input.item.id,
        quantity: input.quantity,
        version: activeCart.version,
        variantOptionIds: input.variantOptionIds,
        addOns: input.addOns,
        notes: input.notes,
      });
      setCart(next);
      setSelectedItem(null);
      setCartOpen(true);
      toast.success(`${input.item.name} added`);
    } catch (error) {
      toast.error('Could not add this item', { description: errorMessage(error) });
    } finally { setCartPending(false); }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!cart || cartPending) return;
    if (quantity < 1) return removeItem(itemId);
    const snapshot = cart;
    setCart({ ...cart, items: cart.items.map((item) => item.id === itemId ? { ...item, quantity } : item) });
    setCartPending(true);
    try {
      setCart(await customerOrderService.updateItem(cart.id, itemId, { quantity, version: cart.version }));
    } catch (error) {
      setCart(snapshot);
      toast.error('Cart update failed', { description: errorMessage(error) });
    } finally { setCartPending(false); }
  };

  const removeItem = async (itemId: string) => {
    if (!cart || cartPending) return;
    const snapshot = cart;
    setCart({ ...cart, items: cart.items.filter((item) => item.id !== itemId) });
    setCartPending(true);
    try {
      setCart(await customerOrderService.removeItem(cart.id, itemId, cart.version));
    } catch (error) {
      setCart(snapshot);
      toast.error('Could not remove item', { description: errorMessage(error) });
    } finally { setCartPending(false); }
  };

  if (status === 'loading') return <PageSkeleton className="customer-order-loading" />;
  if (status === 'error' || !catalog) {
    return <ErrorState title="Ordering unavailable" description="This restaurant could not be loaded." action={<Button onClick={() => void loadCatalog()}>Try again</Button>} />;
  }

  const cover = catalog.media.find((entry) => entry.type === 'COVER');
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: catalog.currency });

  return (
    <div className="customer-order">
      <header className="customer-order-hero" style={cover ? { backgroundImage: `url(${cover.media.url})` } : undefined}>
        <nav className="customer-order-nav">
          <a href="#menu">Menu</a>
          <Button className="customer-cart-trigger" variant="secondary" onClick={() => setCartOpen(true)}>
            Cart <span>{itemCount}</span>{cart ? <strong>{money.format(Number(cart.total))}</strong> : null}
          </Button>
        </nav>
        <div className="customer-order-hero__content">
          <p>Order from</p>
          <h1>{catalog.name}</h1>
          <span>{catalog.description || 'Freshly prepared for you.'}</span>
          {catalog.settings ? <small>Usually ready in {catalog.settings.estimatedPrepMinutes} minutes</small> : null}
        </div>
      </header>

      <main id="menu" className="customer-menu">
        <div className="customer-menu-heading">
          <div><span>Browse</span><h2>Choose your meal</h2></div>
          {catalog.menus.length > 1 ? (
            <div className="customer-menu-tabs">
              {catalog.menus.map((entry) => <button className={entry.id === menu?.id ? 'is-active' : ''} key={entry.id} onClick={() => { setActiveMenu(entry.id); setActiveCategory(entry.categories[0]?.id ?? ''); }}>{entry.name}</button>)}
            </div>
          ) : null}
        </div>
        <nav className="customer-category-nav" aria-label="Menu categories">
          <button className={!activeCategory ? 'is-active' : ''} onClick={() => setActiveCategory('')}>All</button>
          {categories.map((category) => <button className={activeCategory === category.id ? 'is-active' : ''} key={category.id} onClick={() => setActiveCategory(category.id)}>{category.name}</button>)}
        </nav>
        {!categories.length ? <EmptyState title="Menu coming soon" description="There are no items available to order right now." /> : null}
        <div className="customer-menu-sections">
          {visibleCategories.map((category) => (
            <section key={category.id}>
              <div className="customer-category-heading"><h3>{category.name}</h3><p>{category.description}</p></div>
              <div className="customer-item-list">
                {category.items.map((item, index) => (
                  <button className="customer-item" key={item.id} style={{ animationDelay: `${index * 45}ms` }} onClick={() => setSelectedItem(item)}>
                    <span className="customer-item__copy">
                      <span>{item.isFeatured ? 'Featured' : category.name}</span>
                      <strong>{item.name}</strong>
                      <small>{item.description || 'Prepared to order.'}</small>
                      <b>{money.format(Number(item.basePrice))}</b>
                    </span>
                    <span className="customer-item__image">
                      {item.media[0] ? <img alt={item.media[0].alt ?? ''} src={item.media[0].media.url} /> : <i>{item.name.charAt(0)}</i>}
                      <em>+</em>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <ItemConfigurator item={selectedItem} currency={catalog.currency} pending={cartPending} onAdd={addToCart} onOpenChange={(open) => { if (!open) setSelectedItem(null); }} />
      <CartDrawer cart={cart} currency={catalog.currency} open={cartOpen} pending={cartPending} onOpenChange={setCartOpen} onQuantity={updateQuantity} onRemove={removeItem} onStart={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); router.push(`/checkout?restaurantId=${catalog.id}`); }} />
    </div>
  );
}

function ItemConfigurator({ currency, item, onAdd, onOpenChange, pending }: {
  currency: string;
  item: CatalogItem | null;
  onAdd: (input: { item: CatalogItem; quantity: number; variantOptionIds: string[]; addOns: Array<{ addOnId: string; quantity: number }>; notes: string | null }) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
}) {
  const [options, setOptions] = useState<Record<string, string>>({});
  const [addOns, setAddOns] = useState<Record<string, boolean>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!item) return;
    setOptions({}); setAddOns({}); setQuantity(1); setNotes(''); setError('');
  }, [item]);
  const unitPrice = useMemo(() => {
    if (!item) return 0;
    return Number(item.basePrice)
      + item.variants.flatMap((variant) => variant.options).filter((entry) => Object.values(options).includes(entry.id)).reduce((sum, entry) => sum + Number(entry.priceAdjustment), 0)
      + item.addOnGroups.flatMap((group) => group.addOns).filter((entry) => addOns[entry.id]).reduce((sum, entry) => sum + Number(entry.price), 0);
  }, [addOns, item, options]);
  if (!item) return null;
  const submit = () => {
    for (const group of item.addOnGroups) {
      const count = group.addOns.filter((entry) => addOns[entry.id]).length;
      if (count < group.minSelection || count > group.maxSelection) {
        setError(`${group.name} requires ${group.minSelection}–${group.maxSelection} selections.`);
        return;
      }
    }
    setError('');
    void onAdd({ item, quantity, variantOptionIds: Object.values(options), addOns: Object.entries(addOns).filter(([, selected]) => selected).map(([addOnId]) => ({ addOnId, quantity: 1 })), notes: notes.trim() || null });
  };
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency });
  return (
    <Modal open panelClassName="customer-item-modal" title={item.name} description={item.description} onOpenChange={onOpenChange} footer={<div className="customer-item-modal__footer"><div className="customer-quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(99, quantity + 1))}>+</button></div><LoadingButton loading={pending} onClick={submit}>Add · {money.format(unitPrice * quantity)}</LoadingButton></div>}>
      {item.media[0] ? <div className="customer-item-modal__image"><img alt={item.media[0].alt ?? ''} src={item.media[0].media.url} /></div> : null}
      {error ? <Alert>{error}</Alert> : null}
      <div className="customer-config-groups">
        {item.variants.map((variant) => (
          <fieldset key={variant.id}><legend>{variant.name}<small>Choose one</small></legend>{variant.options.map((option) => <label key={option.id}><input checked={options[variant.id] === option.id} name={variant.id} type="radio" onChange={() => setOptions({ ...options, [variant.id]: option.id })} /><span>{option.name}</span><b>{Number(option.priceAdjustment) ? `+${money.format(Number(option.priceAdjustment))}` : 'Included'}</b></label>)}</fieldset>
        ))}
        {item.addOnGroups.map((group) => (
          <fieldset key={group.id}><legend>{group.name}<small>{group.minSelection ? `Choose ${group.minSelection}–${group.maxSelection}` : `Up to ${group.maxSelection}`}</small></legend>{group.addOns.map((addOn) => <label key={addOn.id}><input checked={Boolean(addOns[addOn.id])} type="checkbox" onChange={(event) => setAddOns({ ...addOns, [addOn.id]: event.target.checked })} /><span>{addOn.name}</span><b>+{money.format(Number(addOn.price))}</b></label>)}</fieldset>
        ))}
        <label className="customer-notes"><span>Special instructions</span><Textarea maxLength={500} placeholder="Allergies or preparation notes" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      </div>
    </Modal>
  );
}

function CartDrawer({ cart, currency, onCheckout, onOpenChange, onQuantity, onRemove, onStart, open, pending }: {
  cart: CustomerCart | null; currency: string; onCheckout: () => void; onOpenChange: (open: boolean) => void; onQuantity: (id: string, quantity: number) => Promise<void>; onRemove: (id: string) => Promise<void>; onStart: () => void; open: boolean; pending: boolean;
}) {
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency });
  return <Drawer open={open} title="Your cart" onOpenChange={onOpenChange}>
    {!cart?.items.length ? <EmptyState title="Your cart is empty" description="Choose an item from the menu to get started." action={<Button onClick={onStart}>Browse menu</Button>} /> : <div className="customer-cart">
      <div className="customer-cart-lines">{cart.items.map((item) => <article key={item.id}>
        <div className="customer-cart-line__image">{item.menuItem.media[0] ? <img alt="" src={item.menuItem.media[0].media.url} /> : item.menuItem.name.charAt(0)}</div>
        <div><strong>{item.menuItem.name}</strong><small>{item.variantOptions.map((entry) => entry.option.name).concat(item.addOns.map((entry) => entry.addOn.name)).join(' · ') || 'Standard'}</small>{item.notes ? <em>{item.notes}</em> : null}<div className="customer-quantity"><button disabled={pending} onClick={() => void onQuantity(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button disabled={pending} onClick={() => void onQuantity(item.id, item.quantity + 1)}>+</button></div></div>
        <div><b>{money.format(Number(item.totalPrice))}</b><button disabled={pending} onClick={() => void onRemove(item.id)}>Remove</button></div>
      </article>)}</div>
      <dl className="customer-cart-totals"><div><dt>Subtotal</dt><dd>{money.format(Number(cart.subtotal))}</dd></div><div><dt>Tax</dt><dd>{money.format(Number(cart.tax))}</dd></div><div><dt>Total</dt><dd>{money.format(Number(cart.total))}</dd></div></dl>
      <p className="customer-cart-note">Delivery, table service, and payment are selected at checkout.</p>
      <Button id="cart-checkout-btn" onClick={onCheckout}>Checkout · {money.format(Number(cart.total))}</Button>
    </div>}
  </Drawer>;
}
