import type { ReactNode } from 'react';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  action?: ToastAction;
  dedupeKey?: string;
  description?: ReactNode;
  duration?: number;
  id?: string;
};

export type ToastItem = ToastOptions & {
  count: number;
  id: string;
  revision: number;
  title: string;
  tone: ToastTone;
};
