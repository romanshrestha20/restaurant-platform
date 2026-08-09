import { classNames } from '@/lib/class-names';

export function Spinner({ className, label = 'Loading', size = 'md' }: { className?: string; label?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={classNames('spinner', `spinner--${size}`, className)} role="status"><span className="visually-hidden">{label}</span></span>;
}
