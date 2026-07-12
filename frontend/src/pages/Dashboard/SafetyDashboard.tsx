import { Link } from 'react-router-dom';
import { Users, UserCheck, CalendarClock, ArrowRight, ShieldAlert } from 'lucide-react';
import { useDrivers } from '@/hooks/useDrivers';
import { useAuth } from '@/contexts/AuthContext';
import { KpiCard } from '@/components/cards/KpiCard';
import { Card, CardHeader } from '@/components/common/Card';
import { StatusBadge, Badge } from '@/components/common/Badge';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar } from '@/components/common/Misc';
import { DRIVER_STATUS_META } from '@/constants';
import { formatDate, isLicenseExpired, daysUntil } from '@/utils/format';
import type { Driver } from '@/types';

/** Driver-safety focused dashboard for the Safety Officer role. */
export default function SafetyDashboard() {
  const { user } = useAuth();
  // Pull a wide page so we can compute license-expiry stats client-side.
  const { data, isLoading } = useDrivers({ limit: 100, sort: 'licenseExpiry', order: 'asc' });
  const drivers = data?.items ?? [];

  const total = data?.meta.total ?? drivers.length;
  const available = drivers.filter((d) => d.status === 'AVAILABLE' && !isLicenseExpired(d.licenseExpiry)).length;
  const expired = drivers.filter((d) => isLicenseExpired(d.licenseExpiry)).length;
  const expiringSoon = drivers.filter((d) => !isLicenseExpired(d.licenseExpiry) && daysUntil(d.licenseExpiry) <= 30).length;

  // Drivers needing attention first: expired, then soon-to-expire.
  const attention = drivers.filter((d) => isLicenseExpired(d.licenseExpiry) || daysUntil(d.licenseExpiry) <= 30);

  const columns: Column<Driver>[] = [
    {
      key: 'name',
      header: 'Driver',
      render: (d) => (
        <div className="flex items-center gap-3">
          <Avatar name={d.name} />
          <div>
            <p className="font-medium text-content">{d.name}</p>
            <p className="text-xs text-muted">{d.licenseNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'licenseExpiry',
      header: 'License Expiry',
      render: (d) => {
        const exp = isLicenseExpired(d.licenseExpiry);
        const soon = !exp && daysUntil(d.licenseExpiry) <= 30;
        return (
          <div className="flex items-center gap-2">
            <span className={exp ? 'font-semibold text-status-suspended' : 'text-content'}>{formatDate(d.licenseExpiry)}</span>
            {exp ? <Badge tone="red">Expired</Badge> : soon ? <Badge tone="yellow">{daysUntil(d.licenseExpiry)}d left</Badge> : null}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => <StatusBadge status={isLicenseExpired(d.licenseExpiry) ? 'SUSPENDED' : d.status} meta={DRIVER_STATUS_META} />,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-content">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-sm text-muted">Driver safety & license compliance overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Total Drivers" value={total} icon={Users} tone="blue" loading={isLoading} />
        <KpiCard label="Available Drivers" value={available} icon={UserCheck} tone="green" loading={isLoading} />
        <KpiCard
          label="License Expiry"
          value={expired + expiringSoon}
          icon={CalendarClock}
          tone={expired > 0 ? 'red' : expiringSoon > 0 ? 'yellow' : 'green'}
          hint={`${expired} expired · ${expiringSoon} expiring soon`}
          loading={isLoading}
        />
      </div>

      {expired > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-status-suspended/40 bg-status-suspended/10 px-4 py-3 text-sm text-status-suspended">
          <ShieldAlert className="h-4 w-4" />
          {expired} driver{expired > 1 ? 's are' : ' is'} auto-suspended due to expired licenses — blocked from dispatch.
        </div>
      )}

      <Card className="mt-4">
        <CardHeader
          title="License Compliance"
          subtitle="Drivers with expired or soon-to-expire licenses"
          action={
            <Link to="/drivers" className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
              Manage drivers <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <DataTable
          columns={columns}
          data={attention}
          rowKey={(d) => d.id}
          loading={isLoading}
          emptyTitle="All licenses valid"
          emptyDescription="No drivers have expired or soon-to-expire licenses."
        />
      </Card>
    </div>
  );
}
