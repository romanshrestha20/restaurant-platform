import type { BadgeProps } from '@restaurant/ui';
import type { OrderStatus, OrderType } from '../types';

/** Turns an API enum such as `GOOGLE_PAY` into `Google pay`. */
export function formatEnumLabel(value: string): string {
  const words = value.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatOrderStatus(status: OrderStatus): string {
  return formatEnumLabel(status);
}

export function orderStatusBadgeVariant(status: OrderStatus): BadgeProps['variant'] {
  switch (status) {
    case 'CANCELLED':
    case 'REFUNDED':
      return 'destructive';
    case 'COMPLETED':
    case 'SERVED':
      return 'muted';
    case 'PENDING':
      return 'outline';
    default:
      return 'default';
  }
}

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  DELIVERY: 'Delivery',
  TAKEAWAY: 'Pickup',
  DINE_IN: 'Dine-in',
};

export function formatOrderType(type: OrderType): string {
  return ORDER_TYPE_LABELS[type];
}

export function formatOrderDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
