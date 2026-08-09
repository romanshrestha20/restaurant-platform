import type { ReactNode } from 'react';
import { classNames } from '@/lib/class-names';

export function EmptyState({ action, className, description, icon, title }: { action?: ReactNode; className?: string; description?: ReactNode; icon?: ReactNode; title: string }) {
  return <div className={classNames('empty-state', className)}>{icon ? <div className="empty-state__icon" aria-hidden="true">{icon}</div> : null}<h2>{title}</h2>{description ? <p>{description}</p> : null}{action ? <div className="empty-state__action">{action}</div> : null}</div>;
}
