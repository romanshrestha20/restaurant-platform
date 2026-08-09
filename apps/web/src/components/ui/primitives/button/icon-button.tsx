import { forwardRef } from 'react';
import { classNames } from '@/lib/class-names';
import type { IconButtonProps } from './button.types';

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, label, size = 'md', type = 'button', variant = 'ghost', ...props },
  ref,
) {
  return <button ref={ref} type={type} aria-label={label} title={label} className={classNames('icon-button', `icon-button--${size}`, `icon-button--${variant}`, className)} {...props} />;
});
