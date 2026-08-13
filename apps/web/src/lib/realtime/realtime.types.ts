export type RealtimeStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

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

export interface ServerToClientEvents {
  'realtime:ready': (payload: RealtimeReadyPayload) => void;
  'realtime:pong': (payload: RealtimePongPayload) => void;
}

export interface ClientToServerEvents {
  'realtime:ping': (payload?: RealtimePingPayload) => void;
}
