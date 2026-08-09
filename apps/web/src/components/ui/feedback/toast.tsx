'use client';

import { useEffect, useRef, type FocusEvent, type ReactNode } from 'react';
import { classNames } from '@/lib/class-names';
import type { ToastAction, ToastTone } from '@/lib/toast/toast.types';
import { IconButton } from '../primitives/button';

export type ToastProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  tone?: ToastTone;
  duration?: number;
  action?: ToastAction;
  count?: number;
  resetKey?: number;
};

function ToastIcon({ tone }: { tone: NonNullable<ToastProps['tone']> }) {
  if (tone === 'success') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle className="toast__shape" cx="12" cy="12" r="10" />
        <path className="toast__glyph" d="m7.6 12.1 2.8 2.8 6.2-6.3" />
      </svg>
    );
  }

  if (tone === 'error') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path className="toast__shape" d="m8.2 2.7 7.6.1 5.4 5.4-.1 7.6-5.3 5.4-7.6-.1-5.4-5.3.1-7.6Z" />
        <path className="toast__glyph" d="M12 7.4v6.2M12 17v.1" />
      </svg>
    );
  }

  if (tone === 'warning') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path className="toast__shape" d="M10.25 3.7a2 2 0 0 1 3.5 0l8 14.35A2 2 0 0 1 20 21H4a2 2 0 0 1-1.75-2.95Z" />
        <path className="toast__glyph" d="M12 8.3v5.8M12 17.4v.1" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle className="toast__shape" cx="12" cy="12" r="10" />
      <path className="toast__glyph" d="M12 10.3v6.1M12 7v.1" />
    </svg>
  );
}

export function Toast({
  action,
  count = 1,
  description,
  duration = 3500,
  onOpenChange,
  open,
  resetKey = 0,
  title,
  tone = 'info',
}: ToastProps) {
  const timeoutRef = useRef<number | null>(null);
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(0);
  const onOpenChangeRef = useRef(onOpenChange);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);

  onOpenChangeRef.current = onOpenChange;

  const clearTimer = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  const startTimer = () => {
    if (
      !open ||
      hoveredRef.current ||
      focusedRef.current ||
      remainingRef.current <= 0 ||
      timeoutRef.current !== null
    ) return;
    startedAtRef.current = Date.now();
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      onOpenChangeRef.current(false);
    }, remainingRef.current);
  };

  const pauseTimer = () => {
    if (timeoutRef.current === null) return;
    clearTimer();
    remainingRef.current = Math.max(
      0,
      remainingRef.current - (Date.now() - startedAtRef.current),
    );
  };

  useEffect(() => {
    clearTimer();
    remainingRef.current = duration;
    startTimer();
    return clearTimer;
    // resetKey intentionally restarts a deduplicated toast's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, open, resetKey]);

  if (!open) return null;
  return (
    <div
      className={classNames('toast', `toast--${tone}`)}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => {
        hoveredRef.current = true;
        pauseTimer();
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
        startTimer();
      }}
      onFocusCapture={() => {
        focusedRef.current = true;
        pauseTimer();
      }}
      onBlurCapture={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          focusedRef.current = false;
          startTimer();
        }
      }}
    >
      <span className="toast__icon"><ToastIcon tone={tone} /></span>
      <div className="toast__content">
        <div className="toast__title-row">
          <strong>{title}</strong>
          {count > 1 ? <span className="toast__count" aria-label={`Repeated ${count} times`}>×{count}</span> : null}
        </div>
        {description ? <p>{description}</p> : null}
        {action ? (
          <button
            className="toast__action"
            type="button"
            onClick={() => {
              onOpenChange(false);
              action.onClick();
            }}
          >
            {action.label}
          </button>
        ) : null}
      </div>
      <IconButton className="toast__close" label="Dismiss notification" size="sm" onClick={() => onOpenChange(false)}>
        <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m4 4 8 8M12 4l-8 8" /></svg>
      </IconButton>
    </div>
  );
}

export function ToastViewport({ children }: { children: ReactNode }) {
  return <div className="toast-viewport" role="region" aria-label="Notifications">{children}</div>;
}
