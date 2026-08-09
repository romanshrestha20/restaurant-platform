import type { ReactNode } from 'react';
import { classNames } from '@/lib/class-names';

type AlertProps = {
  children: ReactNode;
  tone?: 'error' | 'success';
};

export function Alert({ children, tone = 'error' }: AlertProps) {
  return (
    <p
      className={classNames('form-alert', `form-alert--${tone}`)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}
