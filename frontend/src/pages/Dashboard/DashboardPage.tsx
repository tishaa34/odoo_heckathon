import { Link } from 'react-router-dom';
import {
  Truck,
  CheckCircle2,
  Wrench,
  Route,
  Clock,
  Users,
  Gauge,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useAnalytics';
import { useTrips } from '@/hooks/useTrips';
import { useAuth } from '@/contexts/AuthContext';
import { KpiCard } from '@/components/cards/KpiCard';
import { Card, CardHeader } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import { Meter } from '@/components/common/Misc';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { ErrorState } from '@/components/common/Feedback';
import { TRIP_STATUS_META } from '@/constants';
import { currency, formatDate } from '@/utils/format';
import type { Trip } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useDashboard();
  const { data: tripsData, isLoading: tripsLoading } = useTrips({ limit: 6, sort: 'createdAt', order: 'desc' });

  const v = data?.vehicles;
  const d = data?.drivers;
  const t = data?.trips;

  const statusBars = [
    { label: 'Available', value: v?.available ?? 0, color: '#16a34a' },
    { label: 'On Trip', value: v?.onTrip ?? 0, color: '#2563eb' },
    { label: 'In Shop', value: v?.inShop ?? 0, color: '#ea580c' },
    { label: 'Retired', value: v?.retired ?? 0, color: '#6b7280' },
  ];
  const maxBar = Math.max(1, ...statusBars.map((s) => s.value));

  const tripColumns: Column<Trip>[] = [
    {
      key: 'route',
      header: 'Route',
      render: (row) => (
        <div>
          <p className="font-medium text-content">
            {row.origin} <span className="text-muted">→</span> {row.destination}
          </p>
          <p className="text-xs text-muted">{formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    { key: 'vehicle', header: 'Vehicle', render: (row) => row.vehicle?.registrationNumber ?? '—' },
    { key: 'driver', header: 'Driver', render: (row) => row.driver?.name ?? '—' },
    { key: 'revenue', header: 'Revenue', align: 'right', render: (row) => currency(row.revenue) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} meta={TRIP_STATUS_META} /> },
  ];

  if (isError) {
    return <ErrorState message="Failed to load dashboard metrics." onRetry={() => refetch()} />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-content">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">Here’s what’s happening across your operations today.</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <KpiCard label="Active Vehicles" value={v?.active ?? 0} icon={Truck} tone="blue" loading={isLoading} />
        <KpiCard label="Available" value={v?.available ?? 0} icon={CheckCircle2} tone="green" loading={isLoading} />
        <KpiCard label="In Maintenance" value={v?.inShop ?? 0} icon={Wrench} tone="orange" loading={isLoading} />
        <KpiCard label="Active Trips" value={t?.active ?? 0} icon={Route} tone="blue" loading={isLoading} />
        <KpiCard label="Pending Trips" value={t?.pending ?? 0} icon={Clock} tone="yellow" loading={isLoading} />
        <KpiCard label="Drivers On Duty" value={d?.onDuty ?? 0} icon={Users} tone="green" loading={isLoading} />
        <KpiCard
          label="Fleet Utilization"
          value={`${data?.fleetUtilization ?? 0}%`}
          icon={Gauge}
          tone="blue"
          loading={isLoading}
        />
        <KpiCard
          label="Net Profit"
          value={currency(data?.financials.netProfit ?? 0)}
          icon={TrendingUp}
          tone={(data?.financials.netProfit ?? 0) >= 0 ? 'green' : 'red'}
          hint={`Revenue ${currency(data?.financials.totalRevenue ?? 0)}`}
          loading={isLoading}
        />
      </div>

      {/* Content row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Trips"
            action={
              <Link to="/trips" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <DataTable
            columns={tripColumns}
            data={tripsData?.items ?? []}
            rowKey={(r) => r.id}
            loading={tripsLoading}
            emptyTitle="No trips yet"
            emptyDescription="Dispatched and completed trips will appear here."
          />
        </Card>

        <Card>
          <CardHeader title="Vehicle Status" subtitle="Live fleet distribution" />
          <div className="space-y-4 p-5">
            {statusBars.map((s) => (
              <div key={s.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted">{s.label}</span>
                  <span className="font-semibold text-content">{s.value}</span>
                </div>
                <Meter value={s.value} max={maxBar} color={s.color} />
              </div>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted">Total Fleet</p>
                <p className="text-lg font-bold text-content">{v?.total ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Operational Cost</p>
                <p className="text-lg font-bold text-content">{currency(data?.financials.totalOperationalCost ?? 0)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
