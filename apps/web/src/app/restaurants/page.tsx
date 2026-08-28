import { CustomerDiscoveryPage } from '@/modules/restaurants/components/customer-discovery-page';
import { ProtectedRoute } from '@/modules/auth';

export default function RestaurantsPage() {
  return (
    <ProtectedRoute>
      <CustomerDiscoveryPage />
    </ProtectedRoute>
  );
}
