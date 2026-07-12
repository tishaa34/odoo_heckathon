import { useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Ban, Download } from 'lucide-react';
import { useDrivers, useDeleteDriver, useUpdateDriver } from '@/hooks/useDrivers';
import { useListControls } from '@/hooks/useListControls';
import { useCanWrite } from '@/components/common/RoleGate';
import { PageHeader, SearchBox, InfoBanner } from '@/components/common/Misc';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Field';
import { StatusBadge, Badge } from '@/components/common/Badge';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar } from '@/components/common/Misc';
import { DriverForm } from './DriverForm';
import { DRIVER_STATUS_META } from '@/constants';
import { formatDate, isLicenseExpired, daysUntil } from '@/utils/format';
import { exportToCsv } from '@/utils/csv';
import type { Driver } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ON_TRIP', label: 'On Trip' },
  { value: 'OFF_DUTY', label: 'Off Duty' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export default function DriversPage() {
  const canWrite = useCanWrite('drivers');
  const { search, onSearch, sort, onSort, filters, setFilter, params, setPage } = useListControls({ sort: 'createdAt', order: 'desc' });
  const { data, isLoading, isFetching } = useDrivers(params);
  const deleteDriver = useDeleteDriver();
  const updateDriver = useUpdateDriver();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [toDelete, setToDelete] = useState<Driver | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const toggleSuspend = (d: Driver) => {
    updateDriver.mutate({ id: d.id, body: { status: d.status === 'SUSPENDED' ? 'AVAILABLE' : 'SUSPENDED' } });
  };

  const columns: Column<Driver>[] = [
    {
      key: 'name',
      header: 'Driver',
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-3">
          <Avatar name={d.name} />
          <div>
            <p className="font-medium text-content">{d.name}</p>
            <p className="text-xs text-muted">{d.phone}</p>
          </div>
        </div>
      ),
    },
    { key: 'licenseNumber', header: 'License', render: (d) => <span className="font-mono text-xs text-content">{d.licenseNumber}</span> },
    {
      key: 'licenseExpiry',
      header: 'Expiry',
      sortable: true,
      render: (d) => {
        const expired = isLicenseExpired(d.licenseExpiry);
        const soon = !expired && daysUntil(d.licenseExpiry) <= 30;
        return (
          <div className="flex items-center gap-1.5">
            <span className={expired ? 'font-semibold text-status-suspended' : 'text-content'}>{formatDate(d.licenseExpiry)}</span>
            {expired && <Badge tone="red">Expired</Badge>}
            {soon && <Badge tone="yellow">Expiring</Badge>}
          </div>
        );
      },
    },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} meta={DRIVER_STATUS_META} /> },
    ...(canWrite
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (d: Driver) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => toggleSuspend(d)}
                  disabled={d.status === 'ON_TRIP'}
                  className="focus-ring rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-status-suspended disabled:opacity-30"
                  aria-label={d.status === 'SUSPENDED' ? 'Reinstate' : 'Suspend'}
                  title={d.status === 'SUSPENDED' ? 'Reinstate driver' : 'Suspend driver'}
                >
                  <Ban className="h-4 w-4" />
                </button>
                <button onClick={() => { setEditing(d); setFormOpen(true); }} className="focus-ring rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-content" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setToDelete(d)} className="focus-ring rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-status-suspended" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const expiredCount = (data?.items ?? []).filter((d) => isLicenseExpired(d.licenseExpiry)).length;

  return (
    <div>
      <PageHeader
        title="Drivers & Safety Profiles"
        subtitle="Manage driver records, licenses and duty status."
        actions={
          <>
            <Button variant="outline" onClick={() => exportToCsv('drivers', [
              { key: 'name', header: 'Name' },
              { key: 'email', header: 'Email' },
              { key: 'phone', header: 'Phone' },
              { key: 'licenseNumber', header: 'License' },
              { key: 'licenseExpiry', header: 'Expiry' },
              { key: 'status', header: 'Status' },
            ], data?.items ?? [])} disabled={!data?.items.length}>
              <Download className="h-4 w-4" /> Export
            </Button>
            {canWrite && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add Driver
              </Button>
            )}
          </>
        }
      />

      {expiredCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-status-suspended/40 bg-status-suspended/10 px-4 py-3 text-sm text-status-suspended">
          <AlertTriangle className="h-4 w-4" />
          {expiredCount} driver{expiredCount > 1 ? 's have' : ' has'} an expired license — blocked from trip assignment.
        </div>
      )}

      <InfoBanner>Expired license or Suspended status automatically blocks a driver from being dispatched.</InfoBanner>

      <Card className="mt-4">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <SearchBox value={search} onChange={onSearch} placeholder="Search name, license, email…" className="sm:max-w-xs" />
          <div className="sm:w-48">
            <Select options={STATUS_OPTIONS} value={filters.status ?? ''} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status" />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          rowKey={(d) => d.id}
          loading={isLoading || isFetching}
          sort={sort}
          onSortChange={onSort}
          emptyTitle="No drivers found"
          emptyDescription={canWrite ? 'Add your first driver to get started.' : 'No drivers match your filters.'}
          emptyAction={canWrite ? { label: 'Add Driver', onClick: openCreate } : undefined}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </Card>

      <DriverForm open={formOpen} onClose={() => setFormOpen(false)} driver={editing} />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete driver?"
        message={`Permanently delete ${toDelete?.name}? Drivers with trip history cannot be deleted.`}
        confirmLabel="Delete"
        danger
        loading={deleteDriver.isPending}
        onConfirm={async () => {
          if (toDelete) await deleteDriver.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
