'use client';

import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { classNames } from '@/lib/class-names';
import { IconButton } from '../primitives/button';

export function Drawer({ children, onOpenChange, open, side = 'right', title }: { children: ReactNode; onOpenChange: (open: boolean) => void; open: boolean; side?: 'left' | 'right'; title: string }) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('overlay-open');
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.classList.remove('overlay-open'); };
  }, [onOpenChange, open]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(<div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}><aside className={classNames('drawer', `drawer--${side}`)} role="dialog" aria-modal="true" aria-labelledby={titleId}><header className="drawer__header"><h2 id={titleId}>{title}</h2><IconButton label="Close drawer" onClick={() => onOpenChange(false)}><span aria-hidden="true">×</span></IconButton></header><div className="drawer__body">{children}</div></aside></div>, document.body);
}
