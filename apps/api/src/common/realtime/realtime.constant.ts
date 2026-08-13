export const REALTIME_NAMESPACE = '/realtime';

export const REALTIME_EVENTS = {
  READY: 'realtime:ready',
  PING: 'realtime:ping',
  PONG: 'realtime:pong',
} as const;

export const realtimeUserRoom = (userId: string): string => `user:${userId}`;
export const realtimeRestaurantRoom = (restaurantId: string): string =>
  `restaurant:${restaurantId}`;
