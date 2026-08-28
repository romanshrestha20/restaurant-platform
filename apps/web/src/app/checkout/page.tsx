import { Suspense } from 'react';
import { CheckoutPage } from '@/modules/order';
import { ProtectedRoute } from '@/modules/auth';

export const metadata = {
  title: 'Checkout',
  description: 'Complete your order',
};

export default function CheckoutRoute() {
  return (
    <Suspense>
      <ProtectedRoute>
        <CheckoutPage />
      </ProtectedRoute>
    </Suspense>
  );
}
