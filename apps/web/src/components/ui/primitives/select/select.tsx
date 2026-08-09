import { forwardRef, type SelectHTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <span className="select-wrap">
      <select ref={ref} className={classNames('ui-select', className)} {...props}>{children}</select>
      <svg aria-hidden="true" viewBox="0 0 12 8"><path d="m1 1.5 5 5 5-5" /></svg>
    </span>
  );
});
