'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/modules/auth';
import { ToastProvider } from '@/lib/toast';
import { ThemeProvider } from '@/lib/theme';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
