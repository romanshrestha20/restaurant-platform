import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { RestaurantProvider } from '@/providers/restaurant-provider';
import { StorefrontShell } from '@/components/layout/storefront-shell';
import { AuthProvider } from '@/features/auth/providers/auth-provider';

export const metadata: Metadata = {
  title: 'Restaurant Platform',
  description: 'Order food online from your favorite restaurants',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
            </div>
          }>
            <AuthProvider>
              <RestaurantProvider>
                <StorefrontShell>{children}</StorefrontShell>
              </RestaurantProvider>
            </AuthProvider>
          </Suspense>
        </QueryProvider>
      </body>
    </html>
  );
}
