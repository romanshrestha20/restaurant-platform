const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type RestaurantSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  settings: {
    estimatedPrepMinutes: number;
    deliveryRadiusKm: number;
    deliveryFee: number;
    minimumOrder: number;
  } | null;
  media: Array<{
    type: string;
    alt: string | null;
    media: { url: string };
  }>;
  addresses: Array<{
    city: string | null;
    country: string | null;
  }>;
  distanceKm: number | null;
  deliveryRadiusKm: number;
  deliveryFee: number;
  minimumOrder: number;
  deliveryAvailable: boolean;
  itemCount: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  preparationTime: number | null;
  calories: number | null;
  isFeatured: boolean;
  media: Array<{
    alt: string | null;
    media: { url: string; width: number | null; height: number | null };
  }>;
  variants: Array<{
    id: string;
    name: string;
    options: Array<{
      id: string;
      name: string;
      priceAdjustment: string;
    }>;
  }>;
  addOnGroups: Array<{
    id: string;
    name: string;
    required: boolean;
    minSelection: number;
    maxSelection: number;
    addOns: Array<{
      id: string;
      name: string;
      price: string;
    }>;
  }>;
};

export type RestaurantCatalog = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  timezone: string;
  settings: {
    estimatedPrepMinutes: number;
    minimumOrder: string;
    deliveryFee: string;
    serviceFee: string;
    taxRate: string;
  } | null;
  media: Array<{
    type: string;
    alt: string | null;
    media: { url: string; width: number | null; height: number | null };
  }>;
  menus: Array<{
    id: string;
    name: string;
    description: string | null;
    categories: Array<{
      id: string;
      name: string;
      description: string | null;
      items: MenuItem[];
    }>;
  }>;
};

async function getCatalog<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}/api/v1/catalog/restaurants${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Catalog request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getRestaurants() {
  return getCatalog<RestaurantSummary[]>("");
}

export function getRestaurantCatalog(slug: string) {
  return getCatalog<RestaurantCatalog>(`/${encodeURIComponent(slug)}`);
}

export function getMediaUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}
