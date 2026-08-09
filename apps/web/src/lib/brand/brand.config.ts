export const brandRegistry = {
  tablefolk: {
    homeHref: '/',
    id: 'tablefolk',
    mark: 'T',
    name: 'Tablefolk',
  },
} as const;

export type BrandId = keyof typeof brandRegistry;
export type BrandConfig = (typeof brandRegistry)[BrandId];

export const DEFAULT_BRAND_ID: BrandId = 'tablefolk';
