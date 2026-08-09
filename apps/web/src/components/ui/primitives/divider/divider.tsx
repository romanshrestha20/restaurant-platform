import { classNames } from '@/lib/class-names';

export function Divider({ className, label }: { className?: string; label?: string }) {
  return <div className={classNames('divider', label && 'divider--labelled', className)} role="separator">{label ? <span>{label}</span> : null}</div>;
}
