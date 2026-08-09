'use client';

import { useEffect, type ReactNode } from 'react';
import { classNames } from '@/lib/class-names';
import { IconButton } from '../primitives/button';

export type ToastProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  tone?: 'neutral' | 'success' | 'error';
  duration?: number;
};

export function Toast({ open, onOpenChange, title, description, tone = 'neutral', duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (!open || duration <= 0) return;
    const timeout = window.setTimeout(() => onOpenChange(false), duration);
    return () => window.clearTimeout(timeout);
  }, [duration, onOpenChange, open]);

  if (!open) return null;
  return (
    <div className={classNames('toast', `toast--${tone}`)} role={tone === 'error' ? 'alert' : 'status'} aria-live={tone === 'error' ? 'assertive' : 'polite'}>
      <span className="toast__mark" aria-hidden="true" />
      <div className="toast__content"><strong>{title}</strong>{description ? <p>{description}</p> : null}</div>
      <IconButton className="toast__close" label="Dismiss notification" size="sm" onClick={() => onOpenChange(false)}><span aria-hidden="true">×</span></IconButton>
    </div>
  );
}

export function ToastViewport({ children }: { children: ReactNode }) {
  return <div className="toast-viewport" aria-label="Notifications">{children}</div>;
}
