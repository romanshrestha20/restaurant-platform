import { classNames } from '@/lib/class-names';
import type { ButtonProps } from './button.types';

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
        'button',
        `button--${variant}`,
        fullWidth && 'button--wide',
        className,
      )}
      type={type}
      {...props}
    />
  );
}
