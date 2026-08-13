import type { Socket } from 'socket.io';
import type { RealtimeUser, RealtimeSocketAuth } from './realtime-auth.types';
import type {
  MenuItemEventData,
  RestaurantDomainEvent,
} from './domain-event.types';

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

export interface ClientToServerEvents {
  'realtime:ping': (payload?: RealtimePingPayload) => void;
}

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

export interface RealtimeSocketData {
  user: RealtimeUser;
  connectedAt: Date;
}

export type RealtimeSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  RealtimeSocketData
> & { handshake: Socket['handshake'] & { auth: RealtimeSocketAuth } };
