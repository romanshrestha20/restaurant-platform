import type { HTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
};

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return <span className={classNames('badge', `badge--${tone}`, className)} {...props} />;
}
