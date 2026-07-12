import { type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Skeleton } from '@/components/common/Feedback';
import type { StatusTone } from '@/constants';

const accents: Record<StatusTone, { bar: string; iconBg: string; icon: string }> = {
  green: { bar: 'bg-status-available', iconBg: 'bg-status-available/15', icon: 'text-status-available' },
  blue: { bar: 'bg-status-ontrip', iconBg: 'bg-status-ontrip/15', icon: 'text-status-ontrip' },
  orange: { bar: 'bg-status-inshop', iconBg: 'bg-status-inshop/15', icon: 'text-status-inshop' },
  gray: { bar: 'bg-muted', iconBg: 'bg-muted/15', icon: 'text-muted' },
  red: { bar: 'bg-status-suspended', iconBg: 'bg-status-suspended/15', icon: 'text-status-suspended' },
  yellow: { bar: 'bg-status-pending', iconBg: 'bg-status-pending/15', icon: 'text-status-pending' },
};

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: StatusTone;
  hint?: string;
  loading?: boolean;
}

export function KpiCard({ label, value, icon: Icon, tone = 'blue', hint, loading }: KpiCardProps) {
  const a = accents[tone];
  return (
    <div className="card relative overflow-hidden p-4">
      <span className={cn('absolute inset-y-0 left-0 w-1', a.bar)} aria-hidden />
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-content">{value}</p>
          )}
          {hint && !loading && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', a.iconBg)}>
            <Icon className={cn('h-4.5 w-4.5', a.icon)} width={18} height={18} />
          </div>
        )}
      </div>
    </div>
  );
}
