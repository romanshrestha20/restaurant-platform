import { forwardRef, type FormHTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

export type FormProps = FormHTMLAttributes<HTMLFormElement> & { spacing?: 'sm' | 'md' | 'lg' };

export const Form = forwardRef<HTMLFormElement, FormProps>(function Form(
  { className, noValidate = true, spacing = 'md', ...props },
  ref,
) {
  return <form ref={ref} noValidate={noValidate} className={classNames('ui-form', `ui-form--${spacing}`, className)} {...props} />;
});
