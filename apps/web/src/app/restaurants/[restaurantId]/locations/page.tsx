import { RestaurantManagementPage } from '@/modules/restaurants';

export default async function RestaurantLocationsPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  return (
    <RestaurantManagementPage restaurantId={restaurantId} section="locations" />
  );
}
