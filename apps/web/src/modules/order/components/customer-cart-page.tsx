'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CustomerNavigation } from '@/components/customer';
import { customerOrderService } from '../services/customer-order.service';
import type { CustomerCart } from '../types/customer-order.types';
import { useToast } from '@/lib/toast';

export function CustomerCartPage() {
  const [carts, setCarts] = useState<CustomerCart[]>([]);
  const [activeCartIndex, setActiveCartIndex] = useState(0);
  const [tipPercentage, setTipPercentage] = useState<number>(10);
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const loadAllCarts = () => {
    try {
      const found: CustomerCart[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tablefolk_customer_cart_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.items && parsed.items.length > 0) {
              found.push(parsed);
            }
          }
        }
      }
      setCarts(found);
    } catch {
      setCarts([]);
    }
  };

  useEffect(() => {
    loadAllCarts();
    window.addEventListener('storage', loadAllCarts);
    return () => window.removeEventListener('storage', loadAllCarts);
  }, []);

  const currentCart = carts[activeCartIndex] || null;

  const updateQuantity = async (cartItemId: string, newQty: number) => {
    if (!currentCart) return;
    setPending(true);
    try {
      if (newQty <= 0) {
        await customerOrderService.removeItem(currentCart.id, cartItemId, currentCart.version);
      } else {
        await customerOrderService.updateItem(currentCart.id, cartItemId, {
          quantity: newQty,
          version: currentCart.version,
        });
      }
      loadAllCarts();
    } catch {
      toast.error('Could not update quantity');
    } finally {
      setPending(false);
    }
  };

  const removeCartItem = async (cartItemId: string) => {
    if (!currentCart) return;
    setPending(true);
    try {
      await customerOrderService.removeItem(currentCart.id, cartItemId, currentCart.version);
      loadAllCarts();
      toast.info('Item removed');
    } catch {
      toast.error('Could not remove item');
    } finally {
      setPending(false);
    }
  };

  const clearCart = async () => {
    if (!currentCart) return;
    await customerOrderService.clear(currentCart.id);
    loadAllCarts();
    toast.info('Cart cleared');
  };

  const currency = currentCart?.currency || 'EUR';
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency });

  const subtotal = Number(currentCart?.subtotal || 0);
  const deliveryFee = subtotal > 0 ? 1.99 : 0;
  const serviceFee = subtotal > 0 ? 0.99 : 0;
  const tipAmount = (subtotal * tipPercentage) / 100;
  const grandTotal = subtotal + deliveryFee + serviceFee + tipAmount;

  return (
    <div className="tf-walkthrough-root">
      <div className="tf-container-wrapper">
        <main className="tf-app-card">
          <CustomerNavigation />

          <div className="tf-cart-page-content">
            <header className="tf-cart-header">
              <span className="tf-hero-eyebrow">YOUR ORDER</span>
              <h1 className="tf-cart-title">Review your cart</h1>
              {carts.length > 1 && (
                <div className="tf-cuisine-pills" style={{ marginTop: '1rem' }}>
                  {carts.map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`tf-pill-btn ${activeCartIndex === idx ? 'is-active' : ''}`}
                      onClick={() => setActiveCartIndex(idx)}
                    >
                      {c.restaurant.name} ({c.items.length})
                    </button>
                  ))}
                </div>
              )}
            </header>

            {!currentCart || currentCart.items.length === 0 ? (
              <div className="tf-cart-empty-state">
                <div className="tf-cart-empty-icon">🛒</div>
                <h2 className="tf-cart-empty-title">Your cart is empty</h2>
                <p className="tf-cart-empty-subtitle">
                  Browse restaurants and add delicious dishes to start your order.
                </p>
                <Link href="/restaurants" className="tf-btn-primary">
                  Browse nearby restaurants
                </Link>
              </div>
            ) : (
              <div className="tf-cart-grid">
                {/* Left: Cart items */}
                <div className="tf-cart-items-column">
                  <div className="tf-cart-restaurant-card">
                    <div className="tf-cart-restaurant-info">
                      <span className="tf-cart-restaurant-label">Ordering from</span>
                      <h2 className="tf-cart-restaurant-name">{currentCart.restaurant.name}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="tf-cart-clear-btn"
                    >
                      Clear cart
                    </button>
                  </div>

                  <div className="tf-cart-lines-list">
                    {currentCart.items.map((item) => {
                      const image = item.menuItem?.media?.[0]?.media?.url;
                      return (
                        <div key={item.id} className="tf-cart-line-row">
                          <div className="tf-cart-line-image-wrap">
                            {image ? (
                              <img src={image} alt={item.menuItem.name} className="tf-cart-line-img" />
                            ) : (
                              <span className="tf-cart-line-fallback">🍽️</span>
                            )}
                          </div>

                          <div className="tf-cart-line-details">
                            <h3 className="tf-cart-line-title">{item.menuItem.name}</h3>
                            {item.notes && (
                              <p className="tf-cart-line-notes">“{item.notes}”</p>
                            )}
                            <div className="tf-cart-line-price">
                              {money.format(Number(item.totalPrice || (item as any).subtotal || item.unitPrice))}
                            </div>
                          </div>

                          <div className="tf-cart-line-actions">
                            <div className="tf-qty-stepper">
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="tf-qty-btn"
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>
                              <span className="tf-qty-value">{item.quantity}</span>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="tf-qty-btn"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => removeCartItem(item.id)}
                              className="tf-cart-remove-btn"
                              aria-label="Remove item"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Kitchen Special Instructions */}
                  <div className="tf-cart-notes-card">
                    <label htmlFor="kitchen-notes" className="tf-cart-notes-label">
                      Special instructions for restaurant
                    </label>
                    <textarea
                      id="kitchen-notes"
                      rows={2}
                      className="tf-cart-notes-textarea"
                      placeholder="Add any cutlery requests, gate codes, or allergy precautions..."
                      value={kitchenNotes}
                      onChange={(e) => setKitchenNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Right: Summary & Tip */}
                <div className="tf-cart-summary-column">
                  <div className="tf-cart-summary-card">
                    <h2 className="tf-summary-heading">Order summary</h2>

                    {/* Tip Selection */}
                    <div className="tf-tip-section">
                      <span className="tf-tip-label">Courier Tip</span>
                      <div className="tf-tip-pills">
                        {[0, 10, 15, 20].map((tip) => (
                          <button
                            key={tip}
                            type="button"
                            className={`tf-tip-pill ${tipPercentage === tip ? 'is-active' : ''}`}
                            onClick={() => setTipPercentage(tip)}
                          >
                            {tip === 0 ? 'None' : `${tip}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="tf-summary-breakdown">
                      <div className="tf-summary-row">
                        <span>Subtotal</span>
                        <span>{money.format(subtotal)}</span>
                      </div>
                      <div className="tf-summary-row">
                        <span>Standard delivery</span>
                        <span>{money.format(deliveryFee)}</span>
                      </div>
                      <div className="tf-summary-row">
                        <span>Service fee</span>
                        <span>{money.format(serviceFee)}</span>
                      </div>
                      {tipAmount > 0 && (
                        <div className="tf-summary-row">
                          <span>Courier tip ({tipPercentage}%)</span>
                          <span>{money.format(tipAmount)}</span>
                        </div>
                      )}
                      <div className="tf-summary-divider" />
                      <div className="tf-summary-row is-total">
                        <span>Total amount</span>
                        <span className="tf-total-amount">{money.format(grandTotal)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="tf-checkout-cta"
                      onClick={() => router.push(`/checkout?restaurantId=${currentCart.restaurantId}`)}
                    >
                      Proceed to Checkout · {money.format(grandTotal)}
                    </button>

                    <p className="tf-summary-footnote">
                      Taxes and delivery distance validated at checkout.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
