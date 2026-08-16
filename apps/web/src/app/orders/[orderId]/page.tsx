import { ProtectedRoute } from '@/modules/auth';
import { OrderDetailPage } from '@/modules/order';

export const metadata = {
  title: 'Order Details',
};

export default async function OrderDetailRoute({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <ProtectedRoute>
      <OrderDetailPage orderId={orderId} />
    </ProtectedRoute>
  );
}
