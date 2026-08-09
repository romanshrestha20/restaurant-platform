import { forwardRef, type LabelHTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & { optional?: boolean };

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { children, className, optional, ...props },
  ref,
) {
  return <label ref={ref} className={classNames('ui-label', className)} {...props}>{children}{optional ? <span>Optional</span> : null}</label>;
});
