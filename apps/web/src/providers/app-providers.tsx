'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/modules/auth';
import { ToastProvider } from '@/lib/toast';
import { ThemeProvider } from '@/lib/theme';
import { BrandProvider, type BrandId } from '@/lib/brand';

export function AppProviders({ brand, children }: { brand: BrandId; children: ReactNode }) {
  return (
    <BrandProvider brand={brand}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrandProvider>
  );
}
