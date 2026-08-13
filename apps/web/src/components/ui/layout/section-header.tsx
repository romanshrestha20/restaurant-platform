import type { ReactNode } from 'react';
import { classNames } from '@/lib/class-names';

export function SectionHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: string;
  title: ReactNode;
}) {
  return (
    <header className={classNames('section-header', className)}>
      <div className="section-header__copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? (
          <div className="section-header__description">{description}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="section-header__actions">{actions}</div>
      ) : null}
    </header>
  );
}
