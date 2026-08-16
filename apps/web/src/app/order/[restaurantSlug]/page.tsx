import { CustomerOrderPage } from '@/modules/order';

export default async function OrderPage({ params }: { params: Promise<{ restaurantSlug: string }> }) {
  const { restaurantSlug } = await params;
  return <CustomerOrderPage slug={restaurantSlug} />;
}
