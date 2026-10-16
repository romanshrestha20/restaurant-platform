import { OrderDetails } from '@/features/orders/components/order-details';

export default async function OrderDetailsRoute({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <OrderDetails orderNumber={orderNumber} />;
}
