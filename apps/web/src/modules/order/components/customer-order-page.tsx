"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "@/components/ui";
import { CustomerNavigation } from "@/components/customer";
import { ApiError } from "@/lib/api";
import { apiClient } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { customerOrderService } from "../services/customer-order.service";
import type {
  CatalogItem,
  CustomerCart,
  CustomerCatalog,
} from "../types/customer-order.types";

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.messages.join(" ") : "Please try again.";

export function CustomerOrderPage({ slug }: { slug: string }) {
  const [catalog, setCatalog] = useState<CustomerCatalog | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [activeMenu, setActiveMenu] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [cart, setCart] = useState<CustomerCart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartPending, setCartPending] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [reservation, setReservation] = useState({ guestName: '', guestEmail: '', guestPhone: '', guestCount: 2, reservationAt: '', specialRequest: '' });
  const [reservationPending, setReservationPending] = useState(false);
  const [reservationMessage, setReservationMessage] = useState('');
  const [favoriteDishes, setFavoriteDishes] = useState<Record<string, boolean>>(
    {},
  );
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    try {
      setFavoriteDishes(
        JSON.parse(localStorage.getItem("tablefolk_favorite_dishes") || "{}"),
      );
    } catch {
      /* ignore malformed local storage */
    }
  }, []);

  const toggleFavoriteDish = (event: React.MouseEvent, item: CatalogItem) => {
    event.stopPropagation();
    setFavoriteDishes((current) => {
      const next = { ...current, [item.id]: !current[item.id] };
      if (!next[item.id]) delete next[item.id];
      try {
        localStorage.setItem("tablefolk_favorite_dishes", JSON.stringify(next));
        localStorage.setItem(
          `tablefolk_favorite_dish_${item.id}`,
          JSON.stringify({ item, restaurant: catalog?.name, slug }),
        );
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  };

  const loadCatalog = useCallback(async () => {
    setStatus("loading");
    try {
      const next = await customerOrderService.catalog(slug);
      setCatalog(next);
      setActiveMenu(next.menus[0]?.id ?? "");
      setActiveCategory(next.menus[0]?.categories[0]?.id ?? "");
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [slug]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!catalog) return;
    void customerOrderService
      .currentCart(catalog.id)
      .then(setCart)
      .catch(() => undefined);
  }, [catalog]);

  const menu =
    catalog?.menus.find((entry) => entry.id === activeMenu) ??
    catalog?.menus[0];
  const categories = menu?.categories ?? [];
  const visibleCategories = activeCategory
    ? categories.filter((entry) => entry.id === activeCategory)
    : categories;

  const itemCount =
    cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

  const addToCart = async (input: {
    item: CatalogItem;
    quantity: number;
    variantOptionIds: string[];
    addOns: Array<{ addOnId: string; quantity: number }>;
    notes: string | null;
  }) => {
    if (!catalog) return;
    setCartPending(true);
    try {
      const activeCart =
        cart ?? (await customerOrderService.createCart(catalog.id));
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
      toast.success(`${input.item.name} added to cart`);
    } catch (error) {
      toast.error("Could not add this item", {
        description: errorMessage(error),
      });
    } finally {
      setCartPending(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!cart || cartPending) return;
    if (quantity < 1) return removeItem(itemId);
    const snapshot = cart;
    setCart({
      ...cart,
      items: cart.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item,
      ),
    });
    setCartPending(true);
    try {
      setCart(
        await customerOrderService.updateItem(cart.id, itemId, {
          quantity,
          version: cart.version,
        }),
      );
    } catch (error) {
      setCart(snapshot);
      toast.error("Cart update failed", { description: errorMessage(error) });
    } finally {
      setCartPending(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!cart || cartPending) return;
    const snapshot = cart;
    setCart({
      ...cart,
      items: cart.items.filter((item) => item.id !== itemId),
    });
    setCartPending(true);
    try {
      setCart(
        await customerOrderService.removeItem(cart.id, itemId, cart.version),
      );
    } catch (error) {
      setCart(snapshot);
      toast.error("Could not remove item", {
        description: errorMessage(error),
      });
    } finally {
      setCartPending(false);
    }
  };

  const submitReservation = async (event: React.FormEvent) => {
    event.preventDefault(); setReservationPending(true); setReservationMessage('');
    try { await apiClient.post('/reservations', { ...reservation, reservationAt: new Date(reservation.reservationAt).toISOString(), restaurantId: catalog?.id }); setReservationMessage('Your table request has been sent.'); setReservationOpen(false); } catch (error) { setReservationMessage(errorMessage(error)); } finally { setReservationPending(false); }
  };

  if (status === "loading") return <PageSkeleton className="discovery-page" />;
  if (status === "error" || !catalog) {
    return (
      <ErrorState
        title="Ordering unavailable"
        description="This restaurant could not be loaded."
        action={<Button onClick={() => void loadCatalog()}>Try again</Button>}
      />
    );
  }

  const cover = catalog.media.find((entry) => entry.type === "COVER");
  const coverUrl =
    cover?.media.url ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";
  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: catalog.currency || "EUR",
  });

  return (
    <div className="tf-walkthrough-root">
      <div className="tf-container-wrapper">
        <main className="tf-app-card">
          <CustomerNavigation />

          {/* Restaurant Hero Banner */}
          <header
            className="tf-menu-hero"
            style={{ backgroundImage: `url(${coverUrl})` }}
          >
            <div className="tf-menu-hero__overlay" />
            <div className="tf-menu-hero__content">
              <Link href="/restaurants" className="tf-menu-back-link">
                ← Back to restaurants
              </Link>
              <span className="tf-menu-hero__eyebrow">ORDER ONLINE</span>
              <h1 className="tf-menu-hero__title">{catalog.name}</h1>
              <p className="tf-menu-hero__desc">
                {catalog.description ||
                  "Modern European dishes crafted from seasonal local ingredients."}
              </p>

              <div className="tf-menu-hero__badges">
                <span className="tf-hero-pill">★ 4.8 (120+ reviews)</span>
                <span className="tf-hero-pill">
                  {catalog.settings?.estimatedPrepMinutes ?? 25}–
                  {(catalog.settings?.estimatedPrepMinutes ?? 25) + 10} min
                  delivery
                </span>
                <span className="tf-hero-pill">€1.99 delivery fee</span>
              </div>
            </div>

            {/* Quick Floating Cart Trigger */}
            <div className="tf-menu-hero__cart-bar">
              <button type="button" className="tf-menu-reservation-trigger" onClick={() => setReservationOpen(true)}>Reserve a table</button>
              <button
                type="button"
                className="tf-menu-cart-trigger"
                onClick={() => setCartOpen(true)}
              >
                <span>🛒 View Cart ({itemCount})</span>
                {cart && Number(cart.total) > 0 && (
                  <strong>{money.format(Number(cart.total))}</strong>
                )}
              </button>
            </div>
          </header>

          {reservationOpen ? <div className="reservation-dialog" role="dialog" aria-modal="true" aria-labelledby="reservation-title"><div className="reservation-dialog__panel"><button type="button" className="reservation-dialog__close" onClick={() => setReservationOpen(false)} aria-label="Close">×</button><span className="tf-menu-hero__eyebrow">BOOK A TABLE</span><h2 id="reservation-title">Reserve at {catalog.name}</h2><form onSubmit={submitReservation}><label>Name<input required value={reservation.guestName} onChange={(e) => setReservation({ ...reservation, guestName: e.target.value })} /></label><div className="reservation-form__split"><label>Date and time<input required type="datetime-local" value={reservation.reservationAt} onChange={(e) => setReservation({ ...reservation, reservationAt: e.target.value })} /></label><label>Guests<input required min="1" max="20" type="number" value={reservation.guestCount} onChange={(e) => setReservation({ ...reservation, guestCount: Number(e.target.value) })} /></label></div><label>Email<input type="email" value={reservation.guestEmail} onChange={(e) => setReservation({ ...reservation, guestEmail: e.target.value })} /></label><label>Phone<input value={reservation.guestPhone} onChange={(e) => setReservation({ ...reservation, guestPhone: e.target.value })} /></label><label>Special request<textarea rows={3} value={reservation.specialRequest} onChange={(e) => setReservation({ ...reservation, specialRequest: e.target.value })} /></label>{reservationMessage ? <p className="form-error">{reservationMessage}</p> : null}<LoadingButton loading={reservationPending} type="submit">Request reservation</LoadingButton></form></div></div> : null}

          {/* Category Tabs */}
          <div className="tf-menu-nav-bar">
            <div className="tf-menu-tabs-scroll">
              <button
                type="button"
                className={`tf-menu-tab ${!activeCategory ? "is-active" : ""}`}
                onClick={() => setActiveCategory("")}
              >
                All items
              </button>
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  className={`tf-menu-tab ${activeCategory === category.id ? "is-active" : ""}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Sections & Dishes Grid */}
          <div className="tf-menu-body">
            {!categories.length ? (
              <EmptyState
                title="Menu coming soon"
                description="There are no items available to order right now."
              />
            ) : null}

            {visibleCategories.map((category) => (
              <section key={category.id} className="tf-menu-category-section">
                <div className="tf-menu-category-header">
                  <h2 className="tf-category-name">{category.name}</h2>
                  {category.description && (
                    <p className="tf-category-desc">{category.description}</p>
                  )}
                </div>

                <div className="tf-dishes-grid">
                  {category.items.map((item, index) => {
                    const itemImage = item.media[0]?.media?.url;
                    return (
                      <article
                        key={item.id}
                        className="tf-dish-card"
                        style={{ animationDelay: `${index * 40}ms` }}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="tf-dish-card__copy">
                          {item.isFeatured && (
                            <span className="tf-dish-featured-tag">
                              Featured
                            </span>
                          )}
                          <h3 className="tf-dish-title">{item.name}</h3>
                          <p className="tf-dish-desc">{item.description}</p>
                          <span className="tf-dish-price">
                            {money.format(Number(item.basePrice))}
                          </span>
                        </div>

                        <div className="tf-dish-card__media">
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={item.name}
                              className="tf-dish-img"
                              loading="lazy"
                            />
                          ) : (
                            <div className="tf-dish-img-placeholder">🍽️</div>
                          )}
                          <button
                            type="button"
                            className={`tf-dish-favorite-btn ${favoriteDishes[item.id] ? "is-favorited" : ""}`}
                            onClick={(event) => toggleFavoriteDish(event, item)}
                            aria-label={`${favoriteDishes[item.id] ? "Remove" : "Save"} ${item.name} ${favoriteDishes[item.id] ? "from" : "to"} favorites`}
                          >
                            {favoriteDishes[item.id] ? "♥" : "♡"}
                          </button>
                          <button
                            type="button"
                            className="tf-dish-add-btn"
                            aria-label={`Customize and add ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Item Customizer Modal */}
          <ItemConfigurator
            item={selectedItem}
            currency={catalog.currency || "EUR"}
            pending={cartPending}
            onAdd={addToCart}
            onOpenChange={(open) => {
              if (!open) setSelectedItem(null);
            }}
          />

          {/* Slide-Over Cart Drawer */}
          <CartDrawer
            cart={cart}
            currency={catalog.currency || "EUR"}
            open={cartOpen}
            pending={cartPending}
            onOpenChange={setCartOpen}
            onQuantity={updateQuantity}
            onRemove={removeItem}
            onStart={() => setCartOpen(false)}
            onCheckout={() => {
              setCartOpen(false);
              router.push(`/checkout?restaurantId=${catalog.id}`);
            }}
          />
        </main>
      </div>
    </div>
  );
}

function ItemConfigurator({
  currency,
  item,
  onAdd,
  onOpenChange,
  pending,
}: {
  currency: string;
  item: CatalogItem | null;
  onAdd: (input: {
    item: CatalogItem;
    quantity: number;
    variantOptionIds: string[];
    addOns: Array<{ addOnId: string; quantity: number }>;
    notes: string | null;
  }) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
}) {
  const [options, setOptions] = useState<Record<string, string>>({});
  const [addOns, setAddOns] = useState<Record<string, boolean>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) return;
    setOptions({});
    setAddOns({});
    setQuantity(1);
    setNotes("");
    setError("");
  }, [item]);

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    const variantsList = item.variants || [];
    const addOnGroupsList = item.addOnGroups || [];

    return (
      Number(item.basePrice) +
      variantsList
        .flatMap((variant) => variant.options)
        .filter((entry) => Object.values(options).includes(entry.id))
        .reduce((sum, entry) => sum + Number(entry.priceAdjustment || 0), 0) +
      addOnGroupsList
        .flatMap((group) => group.addOns)
        .filter((entry) => addOns[entry.id])
        .reduce((sum, entry) => sum + Number(entry.price || 0), 0)
    );
  }, [addOns, item, options]);

  if (!item) return null;

  const submit = () => {
    const addOnGroupsList = item.addOnGroups || [];
    for (const group of addOnGroupsList) {
      const count = group.addOns.filter((entry) => addOns[entry.id]).length;
      if (group.minSelection && count < group.minSelection) {
        setError(
          `${group.name} requires at least ${group.minSelection} selections.`,
        );
        return;
      }
      if (group.maxSelection && count > group.maxSelection) {
        setError(
          `${group.name} allows at most ${group.maxSelection} selections.`,
        );
        return;
      }
    }
    setError("");
    void onAdd({
      item,
      quantity,
      variantOptionIds: Object.values(options),
      addOns: Object.entries(addOns)
        .filter(([, selected]) => selected)
        .map(([addOnId]) => ({ addOnId, quantity: 1 })),
      notes: notes.trim() || null,
    });
  };

  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  });
  const itemImage = item.media[0]?.media?.url;

  return (
    <Modal
      open
      panelClassName="tf-customizer-modal"
      title={item.name}
      description={item.description}
      onOpenChange={onOpenChange}
      footer={
        <div className="tf-modal-footer">
          <div className="tf-qty-stepper">
            <button
              type="button"
              className="tf-qty-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              −
            </button>
            <span className="tf-qty-value">{quantity}</span>
            <button
              type="button"
              className="tf-qty-btn"
              onClick={() => setQuantity(Math.min(99, quantity + 1))}
            >
              +
            </button>
          </div>
          <LoadingButton
            loading={pending}
            onClick={submit}
            className="tf-btn-add-order"
          >
            Add to order · {money.format(unitPrice * quantity)}
          </LoadingButton>
        </div>
      }
    >
      {itemImage ? (
        <div className="tf-modal-image-wrap">
          <img alt={item.name} src={itemImage} className="tf-modal-image" />
        </div>
      ) : null}

      {error ? <Alert>{error}</Alert> : null}

      <div className="tf-customizer-body">
        {item.variants?.map((variant) => (
          <fieldset key={variant.id} className="tf-config-group">
            <legend className="tf-config-title">
              {variant.name}
              <small>Required</small>
            </legend>
            <div className="tf-config-options">
              {variant.options.map((option) => (
                <label key={option.id} className="tf-config-option-row">
                  <input
                    checked={options[variant.id] === option.id}
                    name={variant.id}
                    type="radio"
                    onChange={() =>
                      setOptions({ ...options, [variant.id]: option.id })
                    }
                  />
                  <span>{option.name}</span>
                  <b>
                    {Number(option.priceAdjustment)
                      ? `+${money.format(Number(option.priceAdjustment))}`
                      : "Included"}
                  </b>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        {item.addOnGroups?.map((group) => (
          <fieldset key={group.id} className="tf-config-group">
            <legend className="tf-config-title">
              {group.name}
              <small>
                {group.minSelection
                  ? `Choose ${group.minSelection}–${group.maxSelection}`
                  : `Up to ${group.maxSelection}`}
              </small>
            </legend>
            <div className="tf-config-options">
              {group.addOns.map((addOn) => (
                <label key={addOn.id} className="tf-config-option-row">
                  <input
                    checked={Boolean(addOns[addOn.id])}
                    type="checkbox"
                    onChange={(event) =>
                      setAddOns({ ...addOns, [addOn.id]: event.target.checked })
                    }
                  />
                  <span>{addOn.name}</span>
                  <b>+{money.format(Number(addOn.price))}</b>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="tf-config-group">
          <label className="tf-config-title">
            Special instructions
            <small>Optional</small>
          </label>
          <Textarea
            maxLength={500}
            placeholder="Allergies, dress on side, extra napkins..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

function CartDrawer({
  cart,
  currency,
  onCheckout,
  onOpenChange,
  onQuantity,
  onRemove,
  onStart,
  open,
  pending,
}: {
  cart: CustomerCart | null;
  currency: string;
  onCheckout: () => void;
  onOpenChange: (open: boolean) => void;
  onQuantity: (id: string, quantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onStart: () => void;
  open: boolean;
  pending: boolean;
}) {
  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  });

  return (
    <Drawer open={open} title="Your cart" onOpenChange={onOpenChange}>
      {!cart?.items.length ? (
        <EmptyState
          title="Your cart is empty"
          description="Choose delicious items from the menu to start your order."
          action={<Button onClick={onStart}>Browse menu</Button>}
        />
      ) : (
        <div className="tf-drawer-cart">
          <div className="tf-drawer-items">
            {cart.items.map((item) => (
              <article key={item.id} className="tf-drawer-item-row">
                <div className="tf-drawer-item-details">
                  <strong>{item.menuItem.name}</strong>
                  {item.notes && <em>“{item.notes}”</em>}
                  <div className="tf-qty-stepper">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        void onQuantity(item.id, item.quantity - 1)
                      }
                      className="tf-qty-btn"
                    >
                      −
                    </button>
                    <span className="tf-qty-value">{item.quantity}</span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        void onQuantity(item.id, item.quantity + 1)
                      }
                      className="tf-qty-btn"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="tf-drawer-item-meta">
                  <b>
                    {money.format(Number(item.totalPrice || item.unitPrice))}
                  </b>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void onRemove(item.id)}
                    className="tf-drawer-remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="tf-drawer-totals">
            <div className="tf-summary-row">
              <span>Subtotal</span>
              <span>{money.format(Number(cart.subtotal))}</span>
            </div>
            <div className="tf-summary-row">
              <span>Delivery fee</span>
              <span>€1.99</span>
            </div>
            <div className="tf-summary-divider" />
            <div className="tf-summary-row is-total">
              <span>Total</span>
              <b>
                {money.format(
                  Number(cart.total || Number(cart.subtotal) + 1.99),
                )}
              </b>
            </div>
          </div>

          <button
            type="button"
            className="tf-drawer-checkout-btn"
            onClick={onCheckout}
          >
            Checkout ·{" "}
            {money.format(Number(cart.total || Number(cart.subtotal) + 1.99))}
          </button>
        </div>
      )}
    </Drawer>
  );
}
