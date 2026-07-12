import { cn } from '@/utils/cn';
import type { StatusTone } from '@/constants';

const toneStyles: Record<StatusTone, string> = {
  green: 'bg-status-available/15 text-status-available ring-status-available/30',
  blue: 'bg-status-ontrip/15 text-status-ontrip ring-status-ontrip/30',
  orange: 'bg-status-inshop/15 text-status-inshop ring-status-inshop/30',
  gray: 'bg-muted/15 text-muted ring-muted/30',
  red: 'bg-status-suspended/15 text-status-suspended ring-status-suspended/30',
  yellow: 'bg-status-pending/15 text-status-pending ring-status-pending/30',
};

export interface BadgeProps {
  tone?: StatusTone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ tone = 'gray', children, dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        toneStyles[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** Renders a status badge from a metadata map, e.g. VEHICLE_STATUS_META. */
export function StatusBadge({
  status,
  meta,
  dot = true,
}: {
  status: string;
  meta: Record<string, { label: string; tone: StatusTone }>;
  dot?: boolean;
}) {
  const m = meta[status] ?? { label: status, tone: 'gray' as StatusTone };
  return (
    <Badge tone={m.tone} dot={dot}>
      {m.label}
    </Badge>
  );
}
