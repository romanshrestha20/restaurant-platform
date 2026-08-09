import { classNames } from '@/lib/class-names';

type StatusBadgeProps = {
  verified: boolean;
};

export function StatusBadge({ verified }: StatusBadgeProps) {
  return (
    <span className={classNames('verification', verified && 'is-verified')}>
      {verified ? 'Verified' : 'Not verified'}
    </span>
  );
}
