import type { ReactNode } from 'react';
import { EmptyState } from './empty-state';

export function ErrorState({
  action,
  description = 'Please try again.',
  title = 'Unable to load this content',
}: {
  action?: ReactNode;
  description?: ReactNode;
  title?: string;
}) {
  return (
    <EmptyState
      action={action}
      className="error-state"
      description={description}
      icon="!"
      title={title}
    />
  );
}
