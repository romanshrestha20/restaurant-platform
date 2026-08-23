import { ProtectedRoute } from '@/modules/auth';
import { OrdersPage } from '@/modules/order';
import { CustomerNavigation } from '@/components/customer';

export const metadata = {
  title: 'My Orders',
  description: 'Your order history',
};

export default function OrdersRoute() {
  return (
    <ProtectedRoute>
      <div className="customer-page"><CustomerNavigation /><OrdersPage /></div>
    </ProtectedRoute>
  );
}
