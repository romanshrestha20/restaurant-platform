import {
  DataPlaceholder,
  RestaurantWorkspace,
} from "@/components/restaurants/restaurant-workspace";
export default function RestaurantPage() {
  return (
    <RestaurantWorkspace
      eyebrow="Restaurant workspace"
      title="Restaurant overview"
      description="Monitor this restaurant’s setup and operating status."
    >
      <DataPlaceholder
        title="No restaurant selected"
        description="Connect this route to a restaurant record from the Admin API."
      />
    </RestaurantWorkspace>
  );
}
