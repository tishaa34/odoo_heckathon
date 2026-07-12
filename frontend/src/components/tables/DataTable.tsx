import { type ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SkeletonTable, EmptyState } from '@/components/common/Feedback';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
}

export interface SortState {
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading,
  sort,
  onSortChange,
  onRowClick,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'No records match your current filters.',
  emptyAction,
}: DataTableProps<T>) {
  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    const nextOrder = sort?.sort === key && sort.order === 'asc' ? 'desc' : 'asc';
    onSortChange({ sort: key, order: nextOrder });
  };

  if (loading && data.length === 0) {
    return <SkeletonTable cols={columns.length} />;
  }

  if (!loading && data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => {
              const active = sort?.sort === col.key;
              return (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted',
                    alignClass[col.align ?? 'left'],
                    col.sortable && 'cursor-pointer select-none hover:text-content',
                    col.headerClassName
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  aria-sort={active ? (sort?.order === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span className={cn('inline-flex items-center gap-1', col.align === 'right' && 'flex-row-reverse')}>
                    {col.header}
                    {col.sortable &&
                      (active ? (
                        sort?.order === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      ))}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={cn(loading && 'opacity-60 transition-opacity')}>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-b border-border/60 last:border-0 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-surface-2'
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('whitespace-nowrap px-4 py-3 text-content', alignClass[col.align ?? 'left'], col.className)}
                >
                  {col.render ? col.render(row) : ((row as Record<string, ReactNode>)[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
