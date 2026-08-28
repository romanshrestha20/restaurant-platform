export type CustomerRestaurant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currency?: string;
  rating?: number;
  cuisine?: string;
  deliveryTime?: string;
  deliveryFeeText?: string;
  deliveryFee?: number;
  minimumOrder?: number;
  minOrder?: number;
  priceRange?: string;
  isClosed?: boolean;
  settings: { estimatedPrepMinutes: number; deliveryRadiusKm?: number } | null;
  media: Array<{
    type: 'LOGO' | 'COVER';
    alt: string | null;
    media: {
      id?: string;
      url: string;
      type?: string;
      width?: number;
      height?: number;
      filename?: string;
      contentType?: string;
      sizeBytes?: number;
      hash?: string;
    };
  }>;
  addresses: Array<{
    id?: string;
    label?: string;
    street?: string;
    city: string;
    postalCode?: string;
    country: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }>;
  itemCount: number;
  distanceKm: number | null;
  deliveryRadiusKm?: number;
  deliveryAvailable?: boolean;
};
