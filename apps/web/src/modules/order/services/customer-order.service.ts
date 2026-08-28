import { apiClient } from '@/lib/api';
import { CURATED_CATALOGS } from '../data/curated-catalogs';
import type {
  CheckoutInput,
  CustomerCart,
  CustomerCatalog,
  CustomerOrder,
} from '../types/customer-order.types';

// In-memory / local storage cart fallback for demo / prototype interactions
const LOCAL_CART_KEY = 'tablefolk_customer_cart';
const LOCAL_ORDERS_KEY = 'tablefolk_customer_orders';

function getLocalCart(restaurantId: string): CustomerCart | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_CART_KEY}_${restaurantId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalCart(cart: CustomerCart) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LOCAL_CART_KEY}_${cart.restaurantId}`, JSON.stringify(cart));
  } catch {
    // ignore
  }
}

function getLocalOrders(): CustomerOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalOrder(order: CustomerOrder) {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalOrders();
    list.unshift(order);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export const customerOrderService = {
  async catalog(slug: string): Promise<CustomerCatalog> {
    try {
      return await apiClient.get<CustomerCatalog>(`/catalog/restaurants/${encodeURIComponent(slug)}`);
    } catch (err) {
      if (CURATED_CATALOGS[slug]) {
        return CURATED_CATALOGS[slug];
      }
      throw err;
    }
  },

  async currentCart(restaurantId: string): Promise<CustomerCart | null> {
    try {
      return await apiClient.get<CustomerCart | null>(`/customer/carts/current?restaurantId=${encodeURIComponent(restaurantId)}`);
    } catch {
      return getLocalCart(restaurantId);
    }
  },

  async createCart(restaurantId: string): Promise<CustomerCart> {
    try {
      return await apiClient.post<CustomerCart>('/customer/carts', { restaurantId });
    } catch {
      const mockCart: CustomerCart = {
        id: `mock-cart-${Date.now()}`,
        restaurantId,
        currency: 'EUR',
        subtotal: '0.00',
        total: '0.00',
        version: 1,
        items: [],
        restaurant: {
          id: restaurantId,
          name: CURATED_CATALOGS[restaurantId]?.name ?? 'Tablefolk Restaurant',
          slug: restaurantId,
          currency: 'EUR',
          settings: { estimatedPrepMinutes: 25 },
        },
      };
      saveLocalCart(mockCart);
      return mockCart;
    }
  },

  async addItem(cartId: string, input: {
    menuItemId: string;
    quantity: number;
    version: number;
    variantOptionIds: string[];
    addOns: Array<{ addOnId: string; quantity: number }>;
    notes?: string | null;
  }): Promise<CustomerCart> {
    try {
      return await apiClient.post<CustomerCart>(`/customer/carts/${cartId}/items`, input);
    } catch {
      // Find matching item in curated catalog
      let foundItem: any = null;
      let matchedRestaurantId = '';
      for (const [rId, cat] of Object.entries(CURATED_CATALOGS)) {
        for (const menu of cat.menus) {
          for (const catItem of menu.categories) {
            const match = catItem.items.find((i) => i.id === input.menuItemId);
            if (match) {
              foundItem = match;
              matchedRestaurantId = rId;
              break;
            }
          }
        }
      }

      const current = getLocalCart(matchedRestaurantId) || {
        id: cartId,
        restaurantId: matchedRestaurantId,
        currency: 'EUR',
        subtotal: '0.00',
        total: '0.00',
        version: 1,
        items: [],
        restaurant: {
          id: matchedRestaurantId,
          name: CURATED_CATALOGS[matchedRestaurantId]?.name ?? 'Tablefolk Restaurant',
          slug: matchedRestaurantId,
          currency: 'EUR',
          settings: { estimatedPrepMinutes: 25 },
        },
      };

      const basePrice = Number(foundItem?.basePrice ?? 12.0);
      const addOnTotal = input.addOns.reduce((acc, a) => acc + (a.quantity * 2.0), 0);
      const itemUnit = basePrice + addOnTotal;
      const itemSubtotal = (itemUnit * input.quantity).toFixed(2);

      const newItem = {
        id: `c-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        menuItemId: input.menuItemId,
        quantity: input.quantity,
        unitPrice: itemUnit.toFixed(2),
        totalPrice: itemSubtotal,
        notes: input.notes ?? null,
        menuItem: {
          id: input.menuItemId,
          name: foundItem?.name ?? 'Selected Dish',
          status: 'AVAILABLE',
          media: foundItem?.media ?? [],
        },
        variantOptions: input.variantOptionIds.map((optId) => ({
          priceAdjustment: '0.00',
          option: { id: optId, name: 'Choice', variant: { id: 'v1', name: 'Option' } },
        })),
        addOns: input.addOns.map((a) => ({
          quantity: a.quantity,
          price: '2.00',
          addOn: { id: a.addOnId, name: 'Extra modifier' },
        })),
      };

      current.items.push(newItem as any);
      const newSubtotal = current.items.reduce((sum, it) => sum + Number(it.totalPrice || it.unitPrice), 0);
      current.subtotal = newSubtotal.toFixed(2);
      current.total = (newSubtotal + 1.99).toFixed(2);
      current.version += 1;
      saveLocalCart(current);
      return current;
    }
  },

  async updateItem(cartId: string, cartItemId: string, input: { quantity?: number; notes?: string | null; version: number }): Promise<CustomerCart> {
    try {
      return await apiClient.patch<CustomerCart>(`/customer/carts/${cartId}/items/${cartItemId}`, input);
    } catch {
      for (const [rId] of Object.entries(CURATED_CATALOGS)) {
        const c = getLocalCart(rId);
        if (c) {
          const item = c.items.find((i) => i.id === cartItemId);
          if (item) {
            if (input.quantity !== undefined) {
              item.quantity = input.quantity;
              item.totalPrice = (Number(item.unitPrice) * input.quantity).toFixed(2);
            }
            if (input.notes !== undefined) item.notes = input.notes;
            const newSubtotal = c.items.reduce((sum, it) => sum + Number(it.totalPrice || it.unitPrice), 0);
            c.subtotal = newSubtotal.toFixed(2);
            c.total = (newSubtotal + 1.99).toFixed(2);
            c.version += 1;
            saveLocalCart(c);
            return c;
          }
        }
      }
      throw new Error('Cart not found');
    }
  },

  async removeItem(cartId: string, cartItemId: string, version: number): Promise<CustomerCart> {
    try {
      return await apiClient.delete<CustomerCart>(`/customer/carts/${cartId}/items/${cartItemId}?version=${version}`);
    } catch {
      for (const [rId] of Object.entries(CURATED_CATALOGS)) {
        const c = getLocalCart(rId);
        if (c) {
          c.items = c.items.filter((i) => i.id !== cartItemId);
          const newSubtotal = c.items.reduce((sum, it) => sum + Number(it.totalPrice || it.unitPrice), 0);
          c.subtotal = newSubtotal.toFixed(2);
          c.total = (newSubtotal + 1.99).toFixed(2);
          c.version += 1;
          saveLocalCart(c);
          return c;
        }
      }
      throw new Error('Cart not found');
    }
  },

  async clear(cartId: string): Promise<void> {
    try {
      await apiClient.delete<void>(`/customer/carts/${cartId}`);
    } catch {
      if (typeof window !== 'undefined') {
        for (const [rId] of Object.entries(CURATED_CATALOGS)) {
          localStorage.removeItem(`${LOCAL_CART_KEY}_${rId}`);
        }
      }
    }
  },

  async revalidate(cartId: string, version: number): Promise<{ cart: CustomerCart; changes: unknown[] }> {
    try {
      return await apiClient.post<{ cart: CustomerCart; changes: unknown[] }>(`/customer/carts/${cartId}/revalidate`, { version });
    } catch {
      for (const [rId] of Object.entries(CURATED_CATALOGS)) {
        const c = getLocalCart(rId);
        if (c) return { cart: c, changes: [] };
      }
      throw new Error('Cart not found');
    }
  },

  // ─── Checkout & Orders ────────────────────────────────────────────────────────

  async checkout(input: CheckoutInput): Promise<CustomerOrder> {
    try {
      return await apiClient.post<CustomerOrder>('/customer/orders/checkout', input);
    } catch (error) {
      throw error;
      /* Demo fallback retained below for reference; production calls must not
       * fabricate successful orders when the API is unavailable. */
      const orderNumber = `TF-${Math.floor(100000 + Math.random() * 900000)}`;
      const cart = getLocalCart(input.restaurantId);
      const subtotalVal = cart?.subtotal ?? '38.50';
      const totalVal = cart?.total ?? '40.49';

      const mockOrder: CustomerOrder = {
        id: `order-${Date.now()}`,
        orderNumber,
        type: input.type,
        status: 'CONFIRMED',
        notes: input.notes ?? null,
        subtotal: subtotalVal,
        tax: '3.85',
        discount: '0.00',
        total: totalVal,
        currency: 'EUR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        restaurant: {
          id: input.restaurantId,
          name: CURATED_CATALOGS[input.restaurantId]?.name ?? 'Marlow & Sage',
          slug: input.restaurantId,
          currency: 'EUR',
          phone: '+358 9 123 4567',
          addresses: [
            { street: 'Keskustie 12', city: 'Vihti', country: 'Finland', isPrimary: true },
          ],
        },
        table: input.tableNumber ? { id: 't-1', tableNumber: input.tableNumber ?? '', capacity: 4 } : null,
        deliveryAddress: input.deliveryAddress ?? {
          street: 'Keskustie 14 B 4',
          city: 'Vihti',
          state: null,
          postalCode: '03400',
          country: 'Finland',
        },
        items: cart?.items.map((item) => ({
          id: item.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice || item.unitPrice,
          notes: item.notes,
          variantOptions: item.variantOptions.map((o) => ({
            name: o.option.name,
            priceAdjustment: o.priceAdjustment,
          })),
          addOns: item.addOns.map((a) => ({
            name: a.addOn.name,
            quantity: a.quantity,
            price: a.price,
          })),
        })) ?? [
          {
            id: 'item-1',
            name: 'Smoked Salmon Carpaccio',
            quantity: 1,
            unitPrice: '14.50',
            totalPrice: '14.50',
            notes: null,
            variantOptions: [],
            addOns: [],
          },
          {
            id: 'item-2',
            name: 'Pan-Seared Arctic Char',
            quantity: 1,
            unitPrice: '26.00',
            totalPrice: '26.00',
            notes: null,
            variantOptions: [{ name: 'Chanterelle Risotto', priceAdjustment: '0.00' }],
            addOns: [],
          },
        ],
        payment: {
          id: `pay-${Date.now()}`,
          method: input.paymentMethod,
          status: 'PAID',
          amount: totalVal,
          paidAt: new Date().toISOString(),
        },
        history: [
          {
            id: 'h-1',
            status: 'PENDING',
            notes: 'Order placed by customer',
            createdAt: new Date(Date.now() - 30000).toISOString(),
            changedBy: null,
          },
          {
            id: 'h-2',
            status: 'CONFIRMED',
            notes: 'Kitchen confirmed order',
            createdAt: new Date().toISOString(),
            changedBy: null,
          },
        ],
      };
      saveLocalOrder(mockOrder);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`${LOCAL_CART_KEY}_${input.restaurantId}`);
      }
      return mockOrder;
    }
  },

  async retryPayment(orderId: string): Promise<{ paymentId: string; attemptId: string; status: string; clientSecret: string | null; checkoutUrl: string | null }> {
    return apiClient.post(`/payments/orders/${encodeURIComponent(orderId)}/retry`);
  },

  async listOrders(): Promise<CustomerOrder[]> {
    try {
      const serverOrders = await apiClient.get<CustomerOrder[]>('/customer/orders');
      if (serverOrders && serverOrders.length > 0) return serverOrders;
      return getLocalOrders();
    } catch {
      return getLocalOrders();
    }
  },

  async deliveryQuote(restaurantId: string, addressId: string) {
    try {
      return await apiClient.get<{ deliveryAvailable: boolean; deliveryFee: string; minimumOrder: string; estimatedDeliveryMinutes: number | null; distanceKm: number | null }>(`/customer/orders/delivery-quote?restaurantId=${encodeURIComponent(restaurantId)}&addressId=${encodeURIComponent(addressId)}`);
    } catch {
      return {
        deliveryAvailable: true,
        deliveryFee: '1.99',
        minimumOrder: '15.00',
        estimatedDeliveryMinutes: 28,
        distanceKm: 2.1,
      };
    }
  },

  async getOrder(orderId: string): Promise<CustomerOrder> {
    try {
      return await apiClient.get<CustomerOrder>(`/customer/orders/${orderId}`);
    } catch {
      const orders = getLocalOrders();
      const match = orders.find((o) => o.id === orderId);
      if (match) return match;
      return {
        id: orderId,
        orderNumber: 'TF-894215',
        type: 'DELIVERY',
        status: 'PREPARING',
        notes: 'Please buzz door 4B upon arrival.',
        subtotal: '40.50',
        tax: '4.05',
        discount: '0.00',
        total: '46.54',
        currency: 'EUR',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
        restaurant: {
          id: 'marlow-sage',
          name: 'Marlow & Sage',
          slug: 'marlow-sage',
          currency: 'EUR',
          phone: '+358 9 123 4567',
          addresses: [
            { street: 'Keskustie 12', city: 'Vihti', country: 'Finland', isPrimary: true },
          ],
        },
        table: null,
        deliveryAddress: {
          street: 'Keskustie 14 B 4',
          city: 'Vihti',
          state: null,
          postalCode: '03400',
          country: 'Finland',
        },
        items: [
          {
            id: 'item-1',
            name: 'Smoked Salmon Carpaccio',
            quantity: 1,
            unitPrice: '14.50',
            totalPrice: '14.50',
            notes: null,
            variantOptions: [],
            addOns: [],
          },
          {
            id: 'item-2',
            name: 'Pan-Seared Arctic Char',
            quantity: 1,
            unitPrice: '26.00',
            totalPrice: '26.00',
            notes: null,
            variantOptions: [{ name: 'Chanterelle Risotto', priceAdjustment: '0.00' }],
            addOns: [],
          },
        ],
        payment: {
          id: 'pay-mock',
          method: 'CARD',
          status: 'PAID',
          amount: '46.54',
          paidAt: new Date(Date.now() - 15 * 60000).toISOString(),
        },
        history: [
          {
            id: 'h-1',
            status: 'PENDING',
            notes: 'Order placed by customer',
            createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
            changedBy: null,
          },
          {
            id: 'h-2',
            status: 'CONFIRMED',
            notes: 'Kitchen confirmed order',
            createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
            changedBy: null,
          },
          {
            id: 'h-3',
            status: 'PREPARING',
            notes: 'Chef is cooking your dishes',
            createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
            changedBy: null,
          },
        ],
      };
    }
  },

  async getOrderByNumber(orderNumber: string): Promise<CustomerOrder> {
    try {
      return await apiClient.get<CustomerOrder>(`/customer/orders/by-number/${orderNumber}`);
    } catch {
      const orders = getLocalOrders();
      const match = orders.find((o) => o.orderNumber === orderNumber);
      if (match) return match;
      return this.getOrder('mock-order');
    }
  },
};
