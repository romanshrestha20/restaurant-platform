export interface CartMedia {
  alt: string | null;
  media: { url: string };
}

export interface CartVariantOption {
  optionId: string;
  priceAdjustment: string;
  option: {
    id: string;
    name: string;
    variant: { id: string; name: string };
  };
}

export interface CartAddOn {
  addOnId: string;
  quantity: number;
  price: string;
  addOn: { id: string; name: string };
}

export interface CartItem {
  id: string;
  menuItemId: string;
  quantity: number;
  notes: string | null;
  unitPrice: string;
  totalPrice: string;
  menuItem: {
    id: string;
    name: string;
    status: string;
    media: CartMedia[];
  };
  variantOptions: CartVariantOption[];
  addOns: CartAddOn[];
}

export interface CartRestaurant {
  id: string;
  name: string;
  slug: string;
  currency: string;
}

export interface Cart {
  id: string;
  userId: string;
  restaurantId: string;
  status: string;
  currency: string;
  version: number;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  items: CartItem[];
  restaurant: CartRestaurant;
}

export interface CreateCartPayload { restaurantId: string; }

export interface AddCartOnSelection { addOnId: string; quantity: number; }

export interface AddCartItemPayload {
  menuItemId: string;
  quantity: number;
  version: number;
  variantOptionIds?: string[];
  addOns?: AddCartOnSelection[];
  notes?: string | null;
}

export interface UpdateCartItemPayload {
  version: number;
  quantity?: number;
  notes?: string | null;
}

export interface RevalidateCartResponse {
  cart: Cart;
  changes: Array<{ cartItemId: string; previousUnitPrice: string; unitPrice: string }>;
}
