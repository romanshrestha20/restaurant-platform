export const DOMAIN_EVENT_NAMES = [
  'order:created',
  'order:updated',
  'order:status_changed',
  'reservation:created',
  'reservation:updated',
  'reservation:cancelled',
  'menu:item_created',
  'menu:item_updated',
  'menu:item_deleted',
  'notification:created',
] as const;

export type DomainEventName = (typeof DOMAIN_EVENT_NAMES)[number];

export type RestaurantDomainEvent<Event extends DomainEventName, Data> = {
  event: Event;
  restaurantId: string;
  occurredAt: string;
  data: Data;
};

export type MenuItemEventData = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: string;
  sortOrder: number;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN';
};

export type NotificationRecord = {
  id: string;
  recipientId: string;
  restaurantId: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};
