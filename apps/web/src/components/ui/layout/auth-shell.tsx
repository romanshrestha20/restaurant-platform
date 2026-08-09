import type { ReactNode } from 'react';
import { Brand } from '../brand';
import { classNames } from '@/lib/class-names';

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  footnote: string;
  compact?: boolean;
};

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  footnote,
  compact = false,
}: AuthShellProps) {
  return (
    <main className="login-shell">
      <section
        className={classNames('login-brand', compact && 'register-brand')}
        aria-label="Tablefolk introduction"
      >
        <Brand light />
        <div className="login-brand__copy">
          <p className="eyebrow eyebrow--light">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <p className="login-brand__foot">{footnote}</p>
      </section>
      <section className={classNames('login-panel', compact && 'register-panel')}>
        <div className={classNames('login-form-wrap', compact && 'register-form-wrap')}>
          {children}
        </div>
      </section>
    </main>
  );
}
