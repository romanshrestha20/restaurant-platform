'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { classNames } from '@/lib/class-names';

export function Dropdown({ align = 'end', children, label, trigger }: { align?: 'start' | 'end'; children: ReactNode; label: string; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', dismiss); document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('mousedown', dismiss); document.removeEventListener('keydown', keydown); };
  }, [open]);
  return <div className="dropdown" ref={rootRef}><button className="dropdown__trigger" type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{trigger}</button>{open ? <div className={classNames('dropdown__menu', `dropdown__menu--${align}`)} role="menu" onClick={() => setOpen(false)}>{children}</div> : null}</div>;
}

export function DropdownItem({ className, danger, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return <button type="button" role="menuitem" className={classNames('dropdown__item', danger && 'dropdown__item--danger', className)} {...props} />;
}
