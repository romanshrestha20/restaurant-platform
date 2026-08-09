'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { brandRegistry, type BrandConfig, type BrandId } from './brand.config';

const BrandContext = createContext<BrandConfig | null>(null);

export function BrandProvider({
  brand,
  children,
}: {
  brand: BrandId;
  children: ReactNode;
}) {
  const config = brandRegistry[brand];

  useEffect(() => {
    document.documentElement.dataset.brand = brand;
  }, [brand]);

  return <BrandContext.Provider value={config}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) throw new Error('useBrand must be used within BrandProvider.');
  return context;
}
