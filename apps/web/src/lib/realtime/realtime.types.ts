export type RealtimeStatus =
  'disconnected' | 'connecting' | 'connected' | 'error';

export interface RealtimeReadyPayload {
  userId: string;
  connectedAt: string;
}

export interface RealtimePingPayload {
  sentAt?: string;
}

export interface RealtimePongPayload {
  sentAt: string | null;
  receivedAt: string;
}

import type {
  MenuItemEventData,
  RestaurantDomainEvent,
} from './domain-event.types';

export interface ServerToClientEvents {
  'realtime:ready': (payload: RealtimeReadyPayload) => void;
  'realtime:pong': (payload: RealtimePongPayload) => void;
  'menu:item_created': (
    payload: RestaurantDomainEvent<
      'menu:item_created',
      { item: MenuItemEventData }
    >,
  ) => void;
  'menu:item_updated': (
    payload: RestaurantDomainEvent<
      'menu:item_updated',
      { item: MenuItemEventData }
    >,
  ) => void;
  'menu:item_deleted': (
    payload: RestaurantDomainEvent<'menu:item_deleted', { itemId: string }>,
  ) => void;
}

export interface ClientToServerEvents {
  'realtime:ping': (payload?: RealtimePingPayload) => void;
}
