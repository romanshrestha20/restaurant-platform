import type { ReactNode } from 'react';
import { classNames } from '@/lib/class-names';

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
        <label htmlFor={htmlFor}>{label}</label>
        {hint ? <span className="field__hint">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="field__error" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
