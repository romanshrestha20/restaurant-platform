import { RestaurantManagementPage } from '@/modules/restaurants';

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  return <RestaurantManagementPage restaurantId={restaurantId} />;
}
