import type { HTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('container', className)} {...props} />;
}
