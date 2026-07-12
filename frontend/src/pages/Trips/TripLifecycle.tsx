import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { TripStatus } from '@/types';

const STAGES: { key: TripStatus; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
];

/** Horizontal stepper for a single trip's lifecycle (or a legend when no status). */
export function TripLifecycle({ status }: { status?: TripStatus }) {
  const cancelled = status === 'CANCELLED';
  const activeIndex = status ? STAGES.findIndex((s) => s.key === status) : -1;

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {STAGES.map((stage, i) => {
        const done = activeIndex > i;
        const current = activeIndex === i;
        return (
          <div key={stage.key} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold transition-colors',
                  done && 'border-status-available bg-status-available text-white',
                  current && !cancelled && 'border-status-ontrip bg-status-ontrip text-white',
                  !done && !current && 'border-border bg-surface-2 text-muted'
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn('whitespace-nowrap text-xs font-medium', current || done ? 'text-content' : 'text-muted')}>
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && <span className={cn('h-px w-6 flex-shrink-0', done ? 'bg-status-available' : 'bg-border')} />}
          </div>
        );
      })}
      {cancelled && (
        <>
          <span className="h-px w-6 flex-shrink-0 bg-status-suspended" />
          <span className="rounded-full bg-status-suspended/15 px-2.5 py-0.5 text-xs font-semibold text-status-suspended">Cancelled</span>
        </>
      )}
    </div>
  );
}
