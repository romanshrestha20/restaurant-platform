import type { ButtonHTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'text';
  fullWidth?: boolean;
};

export function Button({
  className,
  variant = 'primary',
  fullWidth = false,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(
        variant === 'text' ? 'text-button' : 'button',
        variant !== 'text' && `button--${variant}`,
        fullWidth && 'button--wide',
        className,
      )}
      type={type}
      {...props}
    />
  );
}
