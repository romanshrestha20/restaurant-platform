'use client';

import { createExternalStore } from '@/lib/store/create-external-store';
import type { RealtimeStatus } from './realtime.types';

type RealtimeState = {
  status: RealtimeStatus;
  socketId: string | null;
  connectedAt: string | null;
  error: string | null;
};

const initialState: RealtimeState = {
  status: 'disconnected',
  socketId: null,
  connectedAt: null,
  error: null,
};

export const realtimeStore = createExternalStore(initialState);
export const useRealtimeStore = realtimeStore.useStore;
