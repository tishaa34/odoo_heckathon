import { useState } from 'react';
import { Play, CheckCircle2, XCircle, History, Download } from 'lucide-react';
import { useTrips, useTripAction } from '@/hooks/useTrips';
import { useListControls } from '@/hooks/useListControls';
import { useCanWrite } from '@/components/common/RoleGate';
import { PageHeader, SearchBox, InfoBanner } from '@/components/common/Misc';
import { Card, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select, Textarea } from '@/components/common/Field';
import { StatusBadge } from '@/components/common/Badge';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Modal } from '@/components/common/Modal';
import { TripForm } from './TripForm';
import { TripLifecycle } from './TripLifecycle';
import { TripHistoryModal } from './TripHistoryModal';
import { TRIP_STATUS_META } from '@/constants';
import { currency, formatDate, number, shortId } from '@/utils/format';
import { exportToCsv } from '@/utils/csv';
import type { Trip } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function TripsPage() {
  const canDispatch = useCanWrite('trips');
  const { search, onSearch, sort, onSort, filters, setFilter, params, setPage } = useListControls({ sort: 'createdAt', order: 'desc' });
  const { data, isLoading, isFetching } = useTrips(params);
  const action = useTripAction();

  const [historyTrip, setHistoryTrip] = useState<Trip | null>(null);
  const [cancelTrip, setCancelTrip] = useState<Trip | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const run = (id: string, act: 'start' | 'complete') => action.mutate({ id, action: act });

  const doCancel = async () => {
    if (!cancelTrip) return;
    await action.mutateAsync({ id: cancelTrip.id, action: 'cancel', reason: cancelReason || undefined });
    setCancelTrip(null);
    setCancelReason('');
  };

  const ActionButtons = ({ trip }: { trip: Trip }) => {
    const busy = action.isPending && action.variables?.id === trip.id;
    const btn = 'inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold transition-colors disabled:opacity-40';
    return (
      <div className="flex items-center justify-end gap-1">
        {trip.status === 'DISPATCHED' && (
          <button onClick={() => run(trip.id, 'start')} disabled={busy} className={`${btn} bg-status-ontrip/15 text-status-ontrip hover:bg-status-ontrip/25`}>
            <Play className="h-3.5 w-3.5" /> Start
          </button>
        )}
        {trip.status === 'IN_PROGRESS' && (
          <button onClick={() => run(trip.id, 'complete')} disabled={busy} className={`${btn} bg-status-available/15 text-status-available hover:bg-status-available/25`}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Complete
          </button>
        )}
        {['DISPATCHED', 'IN_PROGRESS'].includes(trip.status) && (
          <button onClick={() => setCancelTrip(trip)} disabled={busy} className={`${btn} text-muted hover:bg-surface-2 hover:text-status-suspended`}>
            <XCircle className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
        <button onClick={() => setHistoryTrip(trip)} className={`${btn} text-muted hover:bg-surface-2 hover:text-content`} aria-label="History">
          <History className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  const columns: Column<Trip>[] = [
    {
      key: 'route',
      header: 'Trip',
      render: (t) => (
        <div>
          <p className="font-medium text-content">
            {t.origin} <span className="text-muted">→</span> {t.destination}
          </p>
          <p className="text-xs text-muted">#{shortId(t.id)} · {formatDate(t.createdAt)}</p>
        </div>
      ),
    },
    { key: 'vehicle', header: 'Vehicle', render: (t) => t.vehicle?.registrationNumber ?? '—' },
    { key: 'driver', header: 'Driver', render: (t) => t.driver?.name ?? '—' },
    { key: 'cargo', header: 'Cargo', align: 'right', render: (t) => `${number(t.cargoWeightKg)} kg` },
    { key: 'revenue', header: 'Revenue', align: 'right', render: (t) => currency(t.revenue) },
    { key: 'status', header: 'Status', sortable: true, render: (t) => <StatusBadge status={t.status} meta={TRIP_STATUS_META} /> },
    ...(canDispatch ? [{ key: 'actions', header: '', align: 'right' as const, render: (t: Trip) => <ActionButtons trip={t} /> }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Trips"
        subtitle="Create a trip to reserve a vehicle and driver instantly, then track it through to completion."
        actions={
          <Button variant="outline" onClick={() => exportToCsv('trips', [
            { key: 'origin', header: 'Origin' },
            { key: 'destination', header: 'Destination' },
            { key: 'cargoWeightKg', header: 'Cargo (kg)' },
            { key: 'revenue', header: 'Revenue' },
            { key: 'status', header: 'Status' },
          ], data?.items ?? [])} disabled={!data?.items.length}>
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="px-5 py-4">
          <TripLifecycle />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {canDispatch ? (
          <div className="lg:col-span-1">
            <TripForm />
          </div>
        ) : (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader title="Trips" />
              <div className="p-5">
                <InfoBanner>You have read-only access to trips. Creating trips is limited to Drivers and Fleet Managers.</InfoBanner>
              </div>
            </Card>
          </div>
        )}

        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
            <SearchBox value={search} onChange={onSearch} placeholder="Search origin / destination…" className="sm:max-w-xs" />
            <div className="sm:w-48">
              <Select options={STATUS_OPTIONS} value={filters.status ?? ''} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status" />
            </div>
          </div>
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            rowKey={(t) => t.id}
            loading={isLoading || isFetching}
            sort={sort}
            onSortChange={onSort}
            emptyTitle="No trips yet"
            emptyDescription={canDispatch ? 'Create your first trip using the form.' : 'No trips match your filters.'}
          />
          {data && <Pagination meta={data.meta} onPageChange={setPage} />}
        </Card>
      </div>

      <TripHistoryModal trip={historyTrip} onClose={() => setHistoryTrip(null)} />

      <Modal
        open={!!cancelTrip}
        onClose={() => setCancelTrip(null)}
        title="Cancel trip?"
        description={cancelTrip ? `${cancelTrip.origin} → ${cancelTrip.destination}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelTrip(null)} disabled={action.isPending}>
              Keep Trip
            </Button>
            <Button variant="danger" onClick={doCancel} loading={action.isPending}>
              Cancel Trip
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-muted">
          Cancelling releases the assigned vehicle and driver back to the available pool.
        </p>
        <Textarea
          label="Reason (optional)"
          placeholder="e.g. Vehicle went to shop, customer rescheduled…"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
