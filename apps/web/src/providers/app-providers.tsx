'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/modules/auth';
import { ToastProvider } from '@/lib/toast';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}
