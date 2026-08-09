import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={classNames('ui-textarea', className)} {...props} />;
});
