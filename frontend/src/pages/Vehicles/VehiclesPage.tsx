import { useState } from 'react';
import { Plus, Pencil, Trash2, Archive, Download } from 'lucide-react';
import { useVehicles, useDeleteVehicle, useRetireVehicle } from '@/hooks/useVehicles';
import { useListControls } from '@/hooks/useListControls';
import { useCanWrite } from '@/components/common/RoleGate';
import { PageHeader, SearchBox } from '@/components/common/Misc';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Field';
import { StatusBadge } from '@/components/common/Badge';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { InfoBanner } from '@/components/common/Misc';
import { VehicleForm } from './VehicleForm';
import { VEHICLE_STATUS_META } from '@/constants';
import { number } from '@/utils/format';
import { exportToCsv } from '@/utils/csv';
import type { Vehicle } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_TRIP', label: 'On Trip' },
  { value: 'IN_SHOP', label: 'In Shop' },
  { value: 'RETIRED', label: 'Retired' },
];

export default function VehiclesPage() {
  const canWrite = useCanWrite('vehicles');
  const { setPage, search, onSearch, sort, onSort, filters, setFilter, params } = useListControls({ sort: 'createdAt', order: 'desc' });
  const { data, isLoading, isFetching } = useVehicles(params);
  const deleteVehicle = useDeleteVehicle();
  const retireVehicle = useRetireVehicle();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);
  const [toRetire, setToRetire] = useState<Vehicle | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setFormOpen(true);
  };

  const columns: Column<Vehicle>[] = [
    { key: 'registrationNumber', header: 'Reg. No.', sortable: true, render: (v) => <span className="font-semibold text-content">{v.registrationNumber}</span> },
    { key: 'model', header: 'Make / Model', render: (v) => (
      <div>
        <p className="text-content">{v.make} {v.model}</p>
        <p className="text-xs text-muted">{v.year ?? '—'}</p>
      </div>
    ) },
    { key: 'capacityKg', header: 'Capacity', align: 'right', sortable: true, render: (v) => `${number(v.capacityKg)} kg` },
    { key: 'odometerKm', header: 'Odometer', align: 'right', sortable: true, render: (v) => `${number(v.odometerKm)} km` },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v.status} meta={VEHICLE_STATUS_META} /> },
    ...(canWrite
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (v: Vehicle) => (
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => openEdit(v)} className="focus-ring rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-content" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                {v.status !== 'RETIRED' && (
                  <button onClick={() => setToRetire(v)} className="focus-ring rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-status-inshop" aria-label="Retire">
                    <Archive className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setToDelete(v)} className="focus-ring rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-status-suspended" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const handleExport = () => {
    exportToCsv(
      'vehicles',
      [
        { key: 'registrationNumber', header: 'Registration' },
        { key: 'make', header: 'Make' },
        { key: 'model', header: 'Model' },
        { key: 'year', header: 'Year' },
        { key: 'capacityKg', header: 'Capacity (kg)' },
        { key: 'odometerKm', header: 'Odometer (km)' },
        { key: 'status', header: 'Status' },
      ],
      data?.items ?? []
    );
  };

  return (
    <div>
      <PageHeader
        title="Vehicle Registry"
        subtitle="Manage your fleet master data, capacity and lifecycle status."
        actions={
          <>
            <Button variant="outline" size="md" onClick={handleExport} disabled={!data?.items.length}>
              <Download className="h-4 w-4" /> Export
            </Button>
            {canWrite && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add Vehicle
              </Button>
            )}
          </>
        }
      />

      <InfoBanner>Registration numbers are unique. Retired / In-Shop vehicles are automatically hidden from the Trip Dispatcher.</InfoBanner>

      <Card className="mt-4">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <SearchBox value={search} onChange={onSearch} placeholder="Search registration, make, model…" className="sm:max-w-xs" />
          <div className="sm:w-48">
            <Select options={STATUS_OPTIONS} value={filters.status ?? ''} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status" />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          rowKey={(v) => v.id}
          loading={isLoading || isFetching}
          sort={sort}
          onSortChange={onSort}
          emptyTitle="No vehicles found"
          emptyDescription={canWrite ? 'Add your first vehicle to get started.' : 'No vehicles match your filters.'}
          emptyAction={canWrite ? { label: 'Add Vehicle', onClick: openCreate } : undefined}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </Card>

      <VehicleForm open={formOpen} onClose={() => setFormOpen(false)} vehicle={editing} />

      <ConfirmDialog
        open={!!toRetire}
        title="Retire vehicle?"
        message={`${toRetire?.registrationNumber} will be marked as retired and removed from the dispatch pool. This can’t be undone from the UI.`}
        confirmLabel="Retire"
        danger
        loading={retireVehicle.isPending}
        onConfirm={async () => {
          if (toRetire) await retireVehicle.mutateAsync(toRetire.id);
          setToRetire(null);
        }}
        onCancel={() => setToRetire(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete vehicle?"
        message={`Permanently delete ${toDelete?.registrationNumber}? Vehicles with trip history cannot be deleted — retire them instead.`}
        confirmLabel="Delete"
        danger
        loading={deleteVehicle.isPending}
        onConfirm={async () => {
          if (toDelete) await deleteVehicle.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
