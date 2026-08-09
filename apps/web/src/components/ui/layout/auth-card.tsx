import type { ReactNode } from 'react';
import { classNames } from '@/lib/class-names';

export function AuthCard({ children, className, description, eyebrow, footer, title }: { children: ReactNode; className?: string; description?: ReactNode; eyebrow?: string; footer?: ReactNode; title: string }) {
  return <section className={classNames('auth-card', className)}>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h2>{title}</h2>{description ? <div className="auth-card__description">{description}</div> : null}<div className="auth-card__content">{children}</div>{footer ? <footer className="auth-card__footer">{footer}</footer> : null}</section>;
}
