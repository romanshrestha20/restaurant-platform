'use client';

import { useEffect } from 'react';
import { realtimeClient } from './realtime-client';
import type { ServerToClientEvents } from './realtime.types';

export function useRealtimeEvent<Event extends keyof ServerToClientEvents>(
  event: Event,
  listener: ServerToClientEvents[Event],
): void {
  useEffect(() => realtimeClient.on(event, listener), [event, listener]);
}
