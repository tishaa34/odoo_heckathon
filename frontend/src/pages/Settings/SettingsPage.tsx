import { useNavigate } from 'react-router-dom';
import { Check, Minus, Eye, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PageHeader } from '@/components/common/Misc';
import { Card, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Field';
import { Avatar } from '@/components/common/Misc';
import { Badge } from '@/components/common/Badge';
import { ROLE_LABELS } from '@/constants';
import type { Role } from '@/types';

type Access = 'full' | 'view' | 'none';
const MODULES = ['Fleet', 'Drivers', 'Trips', 'Fuel/Exp.', 'Analytics'] as const;
const RBAC_MATRIX: Record<Role, Record<(typeof MODULES)[number], Access>> = {
  FLEET_MANAGER: { Fleet: 'full', Drivers: 'full', Trips: 'full', 'Fuel/Exp.': 'full', Analytics: 'full' },
  DRIVER: { Fleet: 'view', Drivers: 'none', Trips: 'full', 'Fuel/Exp.': 'full', Analytics: 'none' },
  SAFETY_OFFICER: { Fleet: 'none', Drivers: 'full', Trips: 'view', 'Fuel/Exp.': 'none', Analytics: 'none' },
  FINANCIAL_ANALYST: { Fleet: 'view', Drivers: 'none', Trips: 'none', 'Fuel/Exp.': 'full', Analytics: 'full' },
};

function AccessCell({ access }: { access: Access }) {
  if (access === 'full') return <Check className="mx-auto h-4 w-4 text-status-available" />;
  if (access === 'view')
    return (
      <span className="mx-auto flex items-center justify-center gap-1 text-xs text-status-ontrip">
        <Eye className="h-3.5 w-3.5" /> view
      </span>
    );
  return <Minus className="mx-auto h-4 w-4 text-muted" />;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile, preferences and review access control." />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader title="Profile" />
          <div className="p-5">
            <div className="flex items-center gap-4">
              <Avatar name={user?.name ?? '?'} className="h-14 w-14 text-base" />
              <div>
                <p className="text-lg font-semibold text-content">{user?.name}</p>
                <p className="text-sm text-muted">{user?.email}</p>
                <div className="mt-1.5">{user && <Badge tone="blue">{ROLE_LABELS[user.role]}</Badge>}</div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <Input label="Full Name" value={user?.name ?? ''} disabled />
              <Input label="Email" value={user?.email ?? ''} disabled />
            </div>
            <Button variant="danger" className="mt-5" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </Card>

        {/* System preferences */}
        <Card>
          <CardHeader title="Preferences" subtitle="Local display settings" />
          <div className="space-y-5 p-5">
            <div>
              <p className="label-base">Theme</p>
              <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
                {([
                  { key: 'light', label: 'Light', icon: Sun },
                  { key: 'dark', label: 'Dark', icon: Moon },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${theme === key ? 'bg-brand text-white' : 'text-muted hover:text-content'}`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Depot" defaultValue="Gandhinagar Depot GJ4" />
              <Input label="Currency" defaultValue="INR (₹)" disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Distance Unit" defaultValue="Kilometers" disabled />
              <Input label="Time Zone" defaultValue="Asia/Kolkata" disabled />
            </div>
          </div>
        </Card>
      </div>

      {/* RBAC matrix — visible to Fleet Managers only. */}
      {user?.role === 'FLEET_MANAGER' && (
      <Card className="mt-4">
        <CardHeader title="Role-Based Access Control" subtitle="How access is scoped across the platform" />
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">Role</th>
                {MODULES.map((m) => (
                  <th key={m} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(RBAC_MATRIX) as Role[]).map((role) => (
                <tr key={role} className={`border-b border-border/60 last:border-0 ${user?.role === role ? 'bg-brand/5' : ''}`}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-content">{ROLE_LABELS[role]}</span>
                    {user?.role === role && <Badge tone="orange" className="ml-2">You</Badge>}
                  </td>
                  {MODULES.map((m) => (
                    <td key={m} className="px-4 py-3 text-center">
                      <AccessCell access={RBAC_MATRIX[role][m]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}
    </div>
  );
}
