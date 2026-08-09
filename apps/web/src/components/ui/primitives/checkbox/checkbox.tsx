import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { classNames } from '@/lib/class-names';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: ReactNode;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, id, ...props },
  ref,
) {
  const control = <input ref={ref} id={id} type="checkbox" className="checkbox__input" {...props} />;
  if (!label) return control;
  return <label className={classNames('checkbox', className)}>{control}<span>{label}</span></label>;
});
