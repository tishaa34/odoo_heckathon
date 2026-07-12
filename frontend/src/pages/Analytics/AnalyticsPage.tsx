import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gauge, TrendingUp, Wallet, Download, PiggyBank } from 'lucide-react';
import { useDashboard, useCosts, useDriverAnalytics } from '@/hooks/useAnalytics';
import { useVehicles } from '@/hooks/useVehicles';
import { analyticsApi } from '@/services/api';
import { qk } from '@/services/queryClient';
import { PageHeader } from '@/components/common/Misc';
import { Card, CardHeader } from '@/components/common/Card';
import { KpiCard } from '@/components/cards/KpiCard';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Field';
import { Meter } from '@/components/common/Misc';
import { Badge } from '@/components/common/Badge';
import { ChartCard, SimpleBarChart, SimplePieChart } from '@/components/charts/Charts';
import { EXPENSE_CATEGORY_LABELS, DRIVER_STATUS_META } from '@/constants';
import { currency, number, percent } from '@/utils/format';
import { exportToCsv } from '@/utils/csv';

export default function AnalyticsPage() {
  const { data: dash, isLoading: dashLoading } = useDashboard();
  const { data: costs } = useCosts();
  const { data: driverStats } = useDriverAnalytics();
  const { data: vehiclesData } = useVehicles({ limit: 100 });

  const [roiVehicleId, setRoiVehicleId] = useState('');
  const { data: roi, isFetching: roiLoading } = useQuery({
    queryKey: qk.vehicleRoi(roiVehicleId),
    queryFn: () => analyticsApi.vehicleRoi(roiVehicleId),
    enabled: !!roiVehicleId,
  });

  const fin = dash?.financials;

  const financialBars = [
    { name: 'Revenue', Revenue: fin?.totalRevenue ?? 0 },
    { name: 'Op. Cost', 'Op. Cost': fin?.totalOperationalCost ?? 0 },
    { name: 'Net Profit', 'Net Profit': fin?.netProfit ?? 0 },
  ].map((d) => ({ name: d.name, value: Object.values(d)[1] as number }));

  const costPie = [
    { name: 'Fuel', value: costs?.fuelCost ?? 0, color: '#2563eb' },
    { name: 'Maintenance', value: costs?.maintenanceCost ?? 0, color: '#ea580c' },
    ...(costs?.expenseByCategory ?? [])
      .filter((c) => c.category !== 'FUEL' && c.category !== 'MAINTENANCE')
      .map((c) => ({ name: EXPENSE_CATEGORY_LABELS[c.category], value: c.amount })),
  ];

  const vehiclePie = [
    { name: 'Available', value: dash?.vehicles.available ?? 0, color: '#16a34a' },
    { name: 'On Trip', value: dash?.vehicles.onTrip ?? 0, color: '#2563eb' },
    { name: 'In Shop', value: dash?.vehicles.inShop ?? 0, color: '#ea580c' },
    { name: 'Retired', value: dash?.vehicles.retired ?? 0, color: '#6b7280' },
  ];

  const driverBars = (driverStats?.topDrivers ?? []).slice(0, 6).map((d) => ({ name: d.name.split(' ')[0], value: d.completedTrips }));

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Operational and financial insights across your fleet."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              exportToCsv('cost-summary', [{ key: 'metric', header: 'Metric' }, { key: 'value', header: 'Value' }], [
                { metric: 'Total Revenue', value: fin?.totalRevenue ?? 0 },
                { metric: 'Fuel Cost', value: costs?.fuelCost ?? 0 },
                { metric: 'Maintenance Cost', value: costs?.maintenanceCost ?? 0 },
                { metric: 'Total Operational Cost', value: fin?.totalOperationalCost ?? 0 },
                { metric: 'Net Profit', value: fin?.netProfit ?? 0 },
                { metric: 'Fleet Utilization %', value: dash?.fleetUtilization ?? 0 },
              ])
            }
          >
            <Download className="h-4 w-4" /> Export Report
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Fleet Utilization" value={percent(dash?.fleetUtilization, 1)} icon={Gauge} tone="blue" loading={dashLoading} />
        <KpiCard label="Total Revenue" value={currency(fin?.totalRevenue ?? 0)} icon={TrendingUp} tone="green" loading={dashLoading} />
        <KpiCard label="Operational Cost" value={currency(fin?.totalOperationalCost ?? 0)} icon={Wallet} tone="orange" loading={dashLoading} />
        <KpiCard label="Net Profit" value={currency(fin?.netProfit ?? 0)} icon={PiggyBank} tone={(fin?.netProfit ?? 0) >= 0 ? 'green' : 'red'} loading={dashLoading} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Financial Overview" subtitle="Revenue vs cost vs profit">
          <SimpleBarChart data={financialBars} xKey="name" bars={[{ key: 'value', name: 'Amount (₹)', color: '#d97706' }]} />
        </ChartCard>

        <ChartCard title="Cost Breakdown" subtitle="Operational cost by source">
          <SimplePieChart data={costPie} />
        </ChartCard>

        <ChartCard title="Driver Leaderboard" subtitle="Completed trips per driver">
          <SimpleBarChart data={driverBars} xKey="name" bars={[{ key: 'value', name: 'Completed Trips', color: '#2563eb' }]} />
        </ChartCard>

        <ChartCard title="Fleet Distribution" subtitle="Vehicles by status">
          <SimplePieChart data={vehiclePie} />
        </ChartCard>
      </div>

      {/* Vehicle ROI explorer */}
      <Card className="mt-4">
        <CardHeader
          title="Vehicle ROI Explorer"
          subtitle="ROI = (Revenue − Operating Cost) / Operating Cost"
          action={
            <div className="w-56">
              <Select
                placeholder="Select a vehicle"
                options={(vehiclesData?.items ?? []).map((v) => ({ value: v.id, label: `${v.registrationNumber} · ${v.make} ${v.model}` }))}
                value={roiVehicleId}
                onChange={(e) => setRoiVehicleId(e.target.value)}
                aria-label="Select vehicle for ROI"
              />
            </div>
          }
        />
        <div className="p-5">
          {!roiVehicleId ? (
            <p className="py-8 text-center text-sm text-muted">Select a vehicle to view its return on investment.</p>
          ) : roiLoading ? (
            <p className="py-8 text-center text-sm text-muted">Computing ROI…</p>
          ) : roi ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid grid-cols-2 gap-4">
                <Metric label="ROI" value={roi.roiPercent != null ? `${roi.roiPercent}%` : 'N/A'} tone={roi.roiPercent != null && roi.roiPercent >= 0 ? 'green' : 'red'} />
                <Metric label="Net Profit" value={currency(roi.netProfit)} />
                <Metric label="Revenue" value={currency(roi.totalRevenue)} />
                <Metric label="Operating Cost" value={currency(roi.operatingCost)} />
                <Metric label="Completed Trips" value={String(roi.completedTrips)} />
                <Metric label="Fuel Efficiency" value={roi.fuelEfficiencyKmPerLitre != null ? `${roi.fuelEfficiencyKmPerLitre} km/L` : 'N/A'} />
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Cost Composition</p>
                <div className="space-y-3">
                  {[
                    { label: 'Fuel', value: roi.costBreakdown.fuelCost, color: '#2563eb' },
                    { label: 'Maintenance', value: roi.costBreakdown.maintenanceCost, color: '#ea580c' },
                    { label: 'Other', value: roi.costBreakdown.otherExpenses, color: '#9333ea' },
                  ].map((c) => (
                    <div key={c.label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-muted">{c.label}</span>
                        <span className="font-semibold text-content">{currency(c.value)}</span>
                      </div>
                      <Meter value={c.value} max={Math.max(1, roi.operatingCost)} color={c.color} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Driver status summary */}
      <Card className="mt-4">
        <CardHeader title="Driver Utilization" subtitle={`${driverStats?.onDuty ?? 0} of ${driverStats?.total ?? 0} drivers on duty`} />
        <div className="flex flex-wrap gap-4 p-5">
          {Object.entries(driverStats?.byStatus ?? {}).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <Badge tone={DRIVER_STATUS_META[status]?.tone ?? 'gray'}>{DRIVER_STATUS_META[status]?.label ?? status}</Badge>
              <span className="text-lg font-bold text-content">{number(count)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'red' }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone === 'green' ? 'text-status-available' : tone === 'red' ? 'text-status-suspended' : 'text-content'}`}>{value}</p>
    </div>
  );
}
