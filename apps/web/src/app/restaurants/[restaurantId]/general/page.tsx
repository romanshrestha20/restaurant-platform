import { RestaurantManagementPage } from '@/modules/restaurants';

export default async function RestaurantGeneralPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  return (
    <RestaurantManagementPage restaurantId={restaurantId} section="general" />
  );
}
