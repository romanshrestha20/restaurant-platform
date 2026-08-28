import { CustomerCartPage } from '@/modules/order/components/customer-cart-page';
import { ProtectedRoute } from '@/modules/auth';

export default function CartPage() {
  return (
    <ProtectedRoute>
      <CustomerCartPage />
    </ProtectedRoute>
  );
}
