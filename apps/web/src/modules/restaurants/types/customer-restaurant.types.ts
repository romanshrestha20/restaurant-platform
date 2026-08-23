export type CustomerRestaurant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  currency: string;
  settings: { estimatedPrepMinutes: number } | null;
  media: Array<{ type: 'LOGO' | 'COVER'; alt: string | null; media: { url: string } }>;
  addresses: Array<{ city: string; country: string }>;
  itemCount: number;
  distanceKm: number | null;
  deliveryRadiusKm: number;
  deliveryAvailable: boolean;
};
