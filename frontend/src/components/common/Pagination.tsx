import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { PaginationMeta } from '@/types';

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const { page, totalPages, total, limit } = meta;
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Compact page window around the current page.
  const pages: (number | '…')[] = [];
  const push = (n: number | '…') => pages.push(n);
  const window = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= page - window && p <= page + window)) {
      push(p);
    } else if (pages[pages.length - 1] !== '…') {
      push('…');
    }
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3 sm:flex-row">
      <p className="text-xs text-muted">
        Showing <span className="font-medium text-content">{from}</span>–
        <span className="font-medium text-content">{to}</span> of{' '}
        <span className="font-medium text-content">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!meta.hasPrev}
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-2 disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-2 text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'focus-ring flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors',
                p === page ? 'border-brand bg-brand text-white' : 'border-border text-muted hover:bg-surface-2'
              )}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.hasNext}
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-2 disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
