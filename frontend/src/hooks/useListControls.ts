import { useMemo, useState } from 'react';
import type { SortState } from '@/components/tables/DataTable';

/** Debounce a fast-changing value (search box). */
import { useEffect } from 'react';
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Manages page/search/sort/filter state for a list page and produces the
 *  query params object consumed by the API hooks. */
export function useListControls(initial?: { limit?: number; sort?: string; order?: 'asc' | 'desc' }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ sort: initial?.sort, order: initial?.order });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const debouncedSearch = useDebounced(search);
  const limit = initial?.limit ?? 10;

  const setFilter = (key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const onSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const onSort = (s: SortState) => {
    setSort(s);
    setPage(1);
  };

  const params = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      sort: sort.sort,
      order: sort.order,
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    }),
    [page, limit, debouncedSearch, sort, filters]
  );

  return { page, setPage, search, onSearch, sort, onSort, filters, setFilter, params };
}
