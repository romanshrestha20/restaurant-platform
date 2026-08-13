import { classNames } from '@/lib/class-names';
import { Skeleton } from './skeleton';

export function ListSkeleton({
  className,
  rows = 4,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div className={classNames('list-skeleton', className)} aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton className="list-skeleton__row" key={index} />
      ))}
    </div>
  );
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={classNames('page-skeleton', className)} aria-label="Loading">
      <Skeleton className="page-skeleton__eyebrow" />
      <Skeleton className="page-skeleton__title" />
      <Skeleton className="page-skeleton__description" />
      <ListSkeleton rows={3} />
    </div>
  );
}
