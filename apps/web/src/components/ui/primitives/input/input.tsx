import { forwardRef } from 'react';
import { classNames } from '@/lib/class-names';
import type { InputProps } from './input.types';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...props },
  ref,
) {
  return <input ref={ref} type={type} className={classNames('ui-input', className)} {...props} />;
});
