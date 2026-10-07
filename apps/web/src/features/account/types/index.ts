/** A saved customer address, as returned by GET /profile/addresses. */
export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: string | null;
  longitude: string | null;
  isDefault: boolean;
}

/** A geocoded match from GET /profile/addresses/search. */
export interface AddressSearchResult {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  street: string;
  city: string;
  postalCode: string;
  /** ISO 3166-1 alpha-2, upper case. May be empty when the geocoder has none. */
  country: string;
}

export interface CreateAddressInput {
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
}
