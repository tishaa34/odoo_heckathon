import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/Badge';
import { LoadingBlock } from '@/components/common/Feedback';
import { useTripHistory } from '@/hooks/useTrips';
import { TRIP_STATUS_META } from '@/constants';
import { formatDateTime } from '@/utils/format';
import type { Trip } from '@/types';

export function TripHistoryModal({ trip, onClose }: { trip: Trip | null; onClose: () => void }) {
  const { data, isLoading } = useTripHistory(trip?.id ?? null);

  return (
    <Modal
      open={!!trip}
      onClose={onClose}
      title="Trip Timeline"
      description={trip ? `${trip.origin} → ${trip.destination}` : undefined}
    >
      {isLoading ? (
        <LoadingBlock label="Loading history…" />
      ) : (
        <ol className="relative space-y-5 border-l border-border pl-6">
          {(data ?? []).map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-surface bg-brand" />
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={h.toStatus} meta={TRIP_STATUS_META} dot={false} />
                <span className="text-xs text-muted">{formatDateTime(h.createdAt)}</span>
              </div>
              {h.reason && <p className="mt-1 text-sm text-content">{h.reason}</p>}
            </li>
          ))}
          {!data?.length && <p className="text-sm text-muted">No history recorded.</p>}
        </ol>
      )}
    </Modal>
  );
}
