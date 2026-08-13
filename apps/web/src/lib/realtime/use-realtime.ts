'use client';

import { realtimeClient } from './realtime-client';
import { useRealtimeStore } from './realtime.store';

export function useRealtime() {
  const state = useRealtimeStore();
  return { ...state, ping: realtimeClient.ping.bind(realtimeClient) };
}
