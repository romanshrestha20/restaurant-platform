import type { HTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

export function FormError({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return <p className={classNames('form-error', className)} role="alert" {...props}>{children}</p>;
}
