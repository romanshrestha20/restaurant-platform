import { RestaurantManagementPage } from '@/modules/restaurants';

export default async function RestaurantHoursPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  return (
    <RestaurantManagementPage restaurantId={restaurantId} section="hours" />
  );
}
