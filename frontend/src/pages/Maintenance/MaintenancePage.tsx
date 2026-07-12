import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useMaintenance, useOpenMaintenance, useCloseMaintenance } from '@/hooks/useMaintenance';
import { useAvailableVehicles } from '@/hooks/useVehicles';
import { useListControls } from '@/hooks/useListControls';
import { useCanWrite } from '@/components/common/RoleGate';
import { PageHeader, InfoBanner } from '@/components/common/Misc';
import { Card, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input, Select, Textarea } from '@/components/common/Field';
import { StatusBadge } from '@/components/common/Badge';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { MAINTENANCE_STATUS_META } from '@/constants';
import { currency, formatDate } from '@/utils/format';
import type { MaintenanceLog } from '@/types';

const schema = z.object({
  vehicleId: z.string().uuid('Select a vehicle.'),
  type: z.string().trim().min(2, 'Service type is required.').max(80),
  cost: z.coerce.number().min(0, 'Cannot be negative.').optional().or(z.literal('' as unknown as number)),
  description: z.string().trim().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { value: '', label: 'All Records' },
  { value: 'OPEN', label: 'In Shop' },
  { value: 'CLOSED', label: 'Completed' },
];

function LogServiceForm() {
  const { data: vehiclesData, isLoading } = useAvailableVehicles();
  const open = useOpenMaintenance();
  const vehicles = vehiclesData?.items ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await open.mutateAsync({
        vehicleId: values.vehicleId,
        type: values.type,
        cost: values.cost ? Number(values.cost) : undefined,
        description: values.description || undefined,
      });
      reset();
    } catch (err) {
      (err as { fieldErrors?: { field: string; message: string }[] })?.fieldErrors?.forEach((fe) =>
        setError(fe.field.replace('body.', '') as keyof FormValues, { message: fe.message })
      );
    }
  };

  return (
    <Card>
      <CardHeader title="Log Service Record" subtitle="Opening service moves the vehicle to In Shop." />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5" noValidate>
        <Select
          label="Vehicle (available only)"
          placeholder={isLoading ? 'Loading…' : vehicles.length ? 'Select a vehicle' : 'No available vehicles'}
          options={vehicles.map((v) => ({ value: v.id, label: `${v.registrationNumber} · ${v.make} ${v.model}` }))}
          required
          error={errors.vehicleId?.message}
          {...register('vehicleId')}
        />
        <Input label="Service Type" placeholder="Oil Change / Engine Repair" required error={errors.type?.message} {...register('type')} />
        <Input label="Estimated Cost (₹)" type="number" placeholder="2500" error={errors.cost?.message} {...register('cost')} />
        <Textarea label="Description" placeholder="Notes about the service…" error={errors.description?.message} {...register('description')} />
        <Button type="submit" fullWidth loading={isSubmitting}>
          <Wrench className="h-4 w-4" /> Send to Shop
        </Button>

        <div className="space-y-2 rounded-lg bg-surface-2 p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="rounded bg-status-available/15 px-2 py-0.5 font-semibold text-status-available">Available</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted" />
            <span className="text-muted">open record</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted" />
            <span className="rounded bg-status-inshop/15 px-2 py-0.5 font-semibold text-status-inshop">In Shop</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-status-inshop/15 px-2 py-0.5 font-semibold text-status-inshop">In Shop</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted" />
            <span className="text-muted">close record</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted" />
            <span className="rounded bg-status-available/15 px-2 py-0.5 font-semibold text-status-available">Available</span>
          </div>
        </div>
      </form>
    </Card>
  );
}

export default function MaintenancePage() {
  const canWrite = useCanWrite('maintenance');
  const { sort, onSort, filters, setFilter, params, setPage } = useListControls({ sort: 'createdAt', order: 'desc' });
  const { data, isLoading, isFetching } = useMaintenance(params);
  const close = useCloseMaintenance();
  const [toClose, setToClose] = useState<MaintenanceLog | null>(null);

  const columns: Column<MaintenanceLog>[] = [
    { key: 'vehicle', header: 'Vehicle', render: (m) => <span className="font-semibold text-content">{m.vehicle?.registrationNumber ?? '—'}</span> },
    { key: 'type', header: 'Service', render: (m) => (
      <div>
        <p className="text-content">{m.type}</p>
        {m.description && <p className="max-w-[200px] truncate text-xs text-muted">{m.description}</p>}
      </div>
    ) },
    { key: 'cost', header: 'Cost', align: 'right', sortable: true, render: (m) => currency(m.cost) },
    { key: 'openedAt', header: 'Opened', sortable: true, render: (m) => formatDate(m.openedAt) },
    { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} meta={MAINTENANCE_STATUS_META} /> },
    ...(canWrite
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (m: MaintenanceLog) =>
              m.status === 'OPEN' ? (
                <Button size="sm" variant="outline" onClick={() => setToClose(m)}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Close
                </Button>
              ) : (
                <span className="text-xs text-muted">Closed {formatDate(m.closedAt)}</span>
              ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Log service records and track vehicles in the shop." />

      <InfoBanner icon={Wrench}>In-Shop vehicles are automatically removed from the dispatch pool until service is closed.</InfoBanner>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {canWrite && (
          <div className="lg:col-span-1">
            <LogServiceForm />
          </div>
        )}

        <Card className={canWrite ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="text-sm font-semibold text-content">Service Log</h3>
            <div className="w-40">
              <Select options={STATUS_OPTIONS} value={filters.status ?? ''} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter" />
            </div>
          </div>
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            rowKey={(m) => m.id}
            loading={isLoading || isFetching}
            sort={sort}
            onSortChange={onSort}
            emptyTitle="No service records"
            emptyDescription="Logged maintenance will appear here."
          />
          {data && <Pagination meta={data.meta} onPageChange={setPage} />}
        </Card>
      </div>

      <ConfirmDialog
        open={!!toClose}
        title="Close maintenance?"
        message={`Mark service for ${toClose?.vehicle?.registrationNumber} as complete? The vehicle will be restored to Available.`}
        confirmLabel="Close & Restore"
        loading={close.isPending}
        onConfirm={async () => {
          if (toClose) await close.mutateAsync({ id: toClose.id });
          setToClose(null);
        }}
        onCancel={() => setToClose(null)}
      />
    </div>
  );
}
