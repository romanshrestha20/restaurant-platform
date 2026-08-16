import { ProtectedRoute } from '@/modules/auth';
import { OrdersPage } from '@/modules/order';

export const metadata = {
  title: 'My Orders',
  description: 'Your order history',
};

export default function OrdersRoute() {
  return (
    <ProtectedRoute>
      <OrdersPage />
    </ProtectedRoute>
  );
}
