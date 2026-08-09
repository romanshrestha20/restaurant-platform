'use client';

import { useSyncExternalStore } from 'react';

type StateUpdater<State> =
  | Partial<State>
  | ((current: State) => Partial<State>);

export function createExternalStore<State extends object>(initialState: State) {
  let state = initialState;
  const listeners = new Set<() => void>();

  const getState = () => state;
  const getServerState = () => initialState;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const setState = (updater: StateUpdater<State>) => {
    const update = typeof updater === 'function' ? updater(state) : updater;
    state = { ...state, ...update };
    listeners.forEach((listener) => listener());
  };
  const reset = () => {
    state = initialState;
    listeners.forEach((listener) => listener());
  };
  const useStore = () =>
    useSyncExternalStore(subscribe, getState, getServerState);

  return { getState, reset, setState, subscribe, useStore };
}
