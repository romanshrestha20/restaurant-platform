import { CustomerOrderPage } from '@/modules/order';
import { ProtectedRoute } from '@/modules/auth';

export default async function OrderPage({ params }: { params: Promise<{ restaurantSlug: string }> }) {
  const { restaurantSlug } = await params;
  return (
    <ProtectedRoute>
      <CustomerOrderPage slug={restaurantSlug} />
    </ProtectedRoute>
  );
}
