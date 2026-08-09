import type { ReactNode } from 'react';
import { classNames } from '@/lib/class-names';
import { FormError } from './form-error';
import { Label } from '../primitives/label';

type FormFieldProps = {
  children: ReactNode;
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  fullWidth?: boolean;
};

export function FormField({
  children,
  label,
  htmlFor,
  hint,
  error,
  fullWidth = false,
}: FormFieldProps) {
  return (
    <div className={classNames('field', fullWidth && 'field--full')}>
      <div className="field__label-row">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? <span className="field__hint">{hint}</span> : null}
      </div>
      {children}
      {error ? <FormError id={`${htmlFor}-error`}>{error}</FormError> : null}
    </div>
  );
}
