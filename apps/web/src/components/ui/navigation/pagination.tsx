'use client';

import { classNames } from '@/lib/class-names';
import { IconButton } from '../primitives/button';

export type PaginationProps = {
  currentPage: number;
  disabled?: boolean;
  label?: string;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  totalPages: number;
};

type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end';

function getItems(currentPage: number, totalPages: number, siblingCount: number): PaginationItem[] {
  if (totalPages <= 1) return [1];
  if (totalPages <= 5 + siblingCount * 2) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(2, currentPage - siblingCount);
  const end = Math.min(totalPages - 1, currentPage + siblingCount);
  const items: PaginationItem[] = [1];

  if (start > 2) items.push('ellipsis-start');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < totalPages - 1) items.push('ellipsis-end');
  items.push(totalPages);

  return items;
}

export function Pagination({
  currentPage,
  disabled = false,
  label = 'Pagination',
  onPageChange,
  siblingCount = 1,
  totalPages,
}: PaginationProps) {
  const safeTotal = Math.max(1, totalPages);
  const safeCurrent = Math.min(Math.max(1, currentPage), safeTotal);
  const items = getItems(safeCurrent, safeTotal, Math.max(0, siblingCount));

  return (
    <nav className="pagination" aria-label={label}>
      <IconButton
        label="Previous page"
        size="sm"
        variant="secondary"
        disabled={disabled || safeCurrent === 1}
        onClick={() => onPageChange(safeCurrent - 1)}
      >
        <span aria-hidden="true">←</span>
      </IconButton>
      <ol>
        {items.map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <button
                className={classNames('pagination__page', item === safeCurrent && 'is-active')}
                type="button"
                aria-current={item === safeCurrent ? 'page' : undefined}
                aria-label={`Page ${item}`}
                disabled={disabled}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            </li>
          ) : (
            <li className="pagination__ellipsis" key={item} aria-hidden="true">…</li>
          ),
        )}
      </ol>
      <IconButton
        label="Next page"
        size="sm"
        variant="secondary"
        disabled={disabled || safeCurrent === safeTotal}
        onClick={() => onPageChange(safeCurrent + 1)}
      >
        <span aria-hidden="true">→</span>
      </IconButton>
    </nav>
  );
}
