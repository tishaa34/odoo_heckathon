import { useState } from 'react';
import { Plus, Fuel as FuelIcon, Receipt, Download } from 'lucide-react';
import { useFuelLogs, useExpenses } from '@/hooks/useFuelExpenses';
import { useCosts } from '@/hooks/useAnalytics';
import { useVehicles } from '@/hooks/useVehicles';
import { useListControls } from '@/hooks/useListControls';
import { useCanWrite } from '@/components/common/RoleGate';
import { PageHeader } from '@/components/common/Misc';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Field';
import { Badge } from '@/components/common/Badge';
import { Pagination } from '@/components/common/Pagination';
import { KpiCard } from '@/components/cards/KpiCard';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { LogFuelModal, AddExpenseModal } from './FuelForms';
import { EXPENSE_CATEGORY_LABELS } from '@/constants';
import { currency, formatDate, number } from '@/utils/format';
import { exportToCsv } from '@/utils/csv';
import type { Expense, FuelLog } from '@/types';

export default function FuelPage() {
  const canWrite = useCanWrite('fuel');
  const canExpense = useCanWrite('expenses');
  const [tab, setTab] = useState<'fuel' | 'expenses'>('fuel');
  const [fuelModal, setFuelModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);

  const { data: vehiclesData } = useVehicles({ limit: 100 });
  const vehicleOptions = [{ value: '', label: 'All Vehicles' }, ...(vehiclesData?.items ?? []).map((v) => ({ value: v.id, label: v.registrationNumber }))];

  const fuelCtrl = useListControls({ sort: 'filledAt', order: 'desc' });
  const expCtrl = useListControls({ sort: 'incurredAt', order: 'desc' });
  const { data: fuelData, isLoading: fuelLoading, isFetching: fuelFetching } = useFuelLogs(fuelCtrl.params);
  const { data: expData, isLoading: expLoading, isFetching: expFetching } = useExpenses(expCtrl.params);
  const { data: costs } = useCosts();

  const fuelColumns: Column<FuelLog>[] = [
    { key: 'vehicle', header: 'Vehicle', render: (f) => <span className="font-semibold text-content">{f.vehicle?.registrationNumber ?? '—'}</span> },
    { key: 'filledAt', header: 'Date', sortable: true, render: (f) => formatDate(f.filledAt) },
    { key: 'liters', header: 'Litres', align: 'right', render: (f) => `${number(f.liters)} L` },
    { key: 'odometerKm', header: 'Odometer', align: 'right', render: (f) => (f.odometerKm ? `${number(f.odometerKm)} km` : '—') },
    { key: 'cost', header: 'Fuel Cost', align: 'right', sortable: true, render: (f) => <span className="font-semibold text-content">{currency(f.cost)}</span> },
  ];

  const expenseColumns: Column<Expense>[] = [
    { key: 'category', header: 'Category', render: (e) => <Badge tone={e.category === 'FUEL' ? 'blue' : e.category === 'MAINTENANCE' ? 'orange' : 'gray'}>{EXPENSE_CATEGORY_LABELS[e.category]}</Badge> },
    { key: 'note', header: 'Note', render: (e) => <span className="text-content">{e.note ?? '—'}</span> },
    { key: 'incurredAt', header: 'Date', sortable: true, render: (e) => formatDate(e.incurredAt) },
    { key: 'amount', header: 'Amount', align: 'right', sortable: true, render: (e) => <span className="font-semibold text-content">{currency(e.amount)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Fuel & Expense Management"
        subtitle="Record fuel fills, log operational expenses and track total cost."
        actions={
          <>
            {canWrite && (
              <Button onClick={() => setFuelModal(true)}>
                <Plus className="h-4 w-4" /> Log Fuel
              </Button>
            )}
            {canExpense && (
              <Button variant="secondary" onClick={() => setExpenseModal(true)}>
                <Plus className="h-4 w-4" /> Add Expense
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Fuel Cost" value={currency(costs?.fuelCost ?? 0)} icon={FuelIcon} tone="blue" />
        <KpiCard label="Fuel Consumed" value={`${number(costs?.fuelLiters ?? 0)} L`} icon={FuelIcon} tone="green" />
        <KpiCard label="Maintenance" value={currency(costs?.maintenanceCost ?? 0)} icon={Receipt} tone="orange" />
        <KpiCard label="Total Op. Cost" value={currency(costs?.totalOperationalCost ?? 0)} icon={Receipt} tone="yellow" hint="Fuel + Maintenance + Expenses" />
      </div>

      <Card className="mt-4">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
            <button
              onClick={() => setTab('fuel')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${tab === 'fuel' ? 'bg-brand text-white' : 'text-muted hover:text-content'}`}
            >
              <FuelIcon className="h-4 w-4" /> Fuel Logs
            </button>
            <button
              onClick={() => setTab('expenses')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${tab === 'expenses' ? 'bg-brand text-white' : 'text-muted hover:text-content'}`}
            >
              <Receipt className="h-4 w-4" /> Expenses
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-40">
              {tab === 'fuel' ? (
                <Select options={vehicleOptions} value={fuelCtrl.filters.vehicleId ?? ''} onChange={(e) => fuelCtrl.setFilter('vehicleId', e.target.value)} aria-label="Filter by vehicle" />
              ) : (
                <Select
                  options={[{ value: '', label: 'All Categories' }, ...Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))]}
                  value={expCtrl.filters.category ?? ''}
                  onChange={(e) => expCtrl.setFilter('category', e.target.value)}
                  aria-label="Filter by category"
                />
              )}
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                tab === 'fuel'
                  ? exportToCsv('fuel-logs', fuelColumns.filter((c) => c.key !== 'vehicle').map((c) => ({ key: c.key, header: String(c.header) })), fuelData?.items ?? [])
                  : exportToCsv('expenses', [{ key: 'category', header: 'Category' }, { key: 'note', header: 'Note' }, { key: 'incurredAt', header: 'Date' }, { key: 'amount', header: 'Amount' }], expData?.items ?? [])
              }
            >
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {tab === 'fuel' ? (
          <>
            <DataTable columns={fuelColumns} data={fuelData?.items ?? []} rowKey={(f) => f.id} loading={fuelLoading || fuelFetching} sort={fuelCtrl.sort} onSortChange={fuelCtrl.onSort} emptyTitle="No fuel logs" emptyDescription="Recorded fuel fills will appear here." emptyAction={canWrite ? { label: 'Log Fuel', onClick: () => setFuelModal(true) } : undefined} />
            {fuelData && <Pagination meta={fuelData.meta} onPageChange={fuelCtrl.setPage} />}
          </>
        ) : (
          <>
            <DataTable columns={expenseColumns} data={expData?.items ?? []} rowKey={(e) => e.id} loading={expLoading || expFetching} sort={expCtrl.sort} onSortChange={expCtrl.onSort} emptyTitle="No expenses" emptyDescription="Logged expenses will appear here." emptyAction={canExpense ? { label: 'Add Expense', onClick: () => setExpenseModal(true) } : undefined} />
            {expData && <Pagination meta={expData.meta} onPageChange={expCtrl.setPage} />}
          </>
        )}
      </Card>

      <LogFuelModal open={fuelModal} onClose={() => setFuelModal(false)} />
      <AddExpenseModal open={expenseModal} onClose={() => setExpenseModal(false)} />
    </div>
  );
}
