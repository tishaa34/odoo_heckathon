import { Search, type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { initials } from '@/utils/format';

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand',
        className
      )}
      aria-hidden
    >
      {initials(name) || '?'}
    </div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base pl-9"
        aria-label={placeholder}
      />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-content">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function InfoBanner({ children, icon: Icon }: { children: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
      {Icon && <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />}
      <div className="text-content/80">{children}</div>
    </div>
  );
}

/** Simple horizontal progress meter (used in Vehicle Status card & bars). */
export function Meter({ value, max, color = '#2563eb', className }: { value: number; max: number; color?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-2', className)}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}
