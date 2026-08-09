import type { HTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

export function FormHelperText({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classNames('form-helper', className)} {...props} />;
}
