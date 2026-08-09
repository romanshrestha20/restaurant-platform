'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Toast, ToastViewport } from '@/components/ui/feedback/toast';
import { getApiErrorFeedback } from '@/lib/api';
import type { ToastItem, ToastOptions, ToastTone } from './toast.types';

const MAX_VISIBLE_TOASTS = 4;
const DEFAULT_DURATIONS: Record<ToastTone, number> = {
  success: 2800,
  info: 3500,
  warning: 4500,
  error: 5000,
};

type ToastApi = {
  dismiss: (id: string) => void;
  dismissAll: () => void;
  error: (title: string, options?: ToastOptions) => void;
  fromApiError: (error: unknown, fallback: string) => void;
  info: (title: string, options?: ToastOptions) => void;
  success: (title: string, options?: ToastOptions) => void;
  warning: (title: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const dismissAll = useCallback(() => setItems([]), []);

  const show = useCallback((tone: ToastTone, title: string, options: ToastOptions = {}) => {
    const dedupeKey = options.dedupeKey ?? `${tone}:${title}`;
    const id = options.id ?? `toast-${++nextId.current}`;

    setItems((current) => {
      const duplicateIndex = current.findIndex(
        (item) => (item.dedupeKey ?? `${item.tone}:${item.title}`) === dedupeKey,
      );

      if (duplicateIndex >= 0) {
        return current.map((item, index) =>
          index === duplicateIndex
            ? {
                ...item,
                ...options,
                count: item.count + 1,
                duration: options.duration ?? DEFAULT_DURATIONS[tone],
                revision: item.revision + 1,
                title,
                tone,
              }
            : item,
        );
      }

      const item: ToastItem = {
        ...options,
        count: 1,
        dedupeKey,
        duration: options.duration ?? DEFAULT_DURATIONS[tone],
        id,
        revision: 0,
        title,
        tone,
      };

      return [...current, item].slice(-MAX_VISIBLE_TOASTS);
    });
  }, []);

  const api = useMemo<ToastApi>(() => ({
    dismiss,
    dismissAll,
    error: (title, options) => show('error', title, options),
    fromApiError: (error, fallback) => {
      const feedback = getApiErrorFeedback(error, fallback);
      if (feedback) show('error', feedback.title, { description: feedback.description });
    },
    info: (title, options) => show('info', title, options),
    success: (title, options) => show('success', title, options),
    warning: (title, options) => show('warning', title, options),
  }), [dismiss, dismissAll, show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport>
        {items.map((item) => (
          <Toast
            key={item.id}
            action={item.action}
            count={item.count}
            description={item.description}
            duration={item.duration}
            open
            resetKey={item.revision}
            title={item.title}
            tone={item.tone}
            onOpenChange={(open) => {
              if (!open) dismiss(item.id);
            }}
          />
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider.');
  return context;
}
