import { Suspense } from 'react';
import { CheckoutPage } from '@/modules/order';

export const metadata = {
  title: 'Checkout',
  description: 'Complete your order',
};

export default function CheckoutRoute() {
  return (
    <Suspense>
      <CheckoutPage />
    </Suspense>
  );
}
