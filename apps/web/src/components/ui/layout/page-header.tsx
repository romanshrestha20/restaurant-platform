import type { ReactNode } from 'react';
import { classNames } from '@/lib/class-names';

export function PageHeader({ actions, className, description, eyebrow, title }: { actions?: ReactNode; className?: string; description?: ReactNode; eyebrow?: string; title: ReactNode }) {
  return <header className={classNames('page-header', className)}><div className="page-header__copy">{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h1>{title}</h1>{description ? <div className="page-header__description">{description}</div> : null}</div>{actions ? <div className="page-header__actions">{actions}</div> : null}</header>;
}
