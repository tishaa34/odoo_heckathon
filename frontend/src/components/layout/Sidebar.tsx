import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Fuel,
  LayoutDashboard,
  Route,
  Settings,
  Truck,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { NAV_ITEMS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
};

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
        <Truck className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-base font-bold text-content">TransitOps</p>
        <p className="text-[10px] uppercase tracking-wider text-muted">Ops Platform</p>
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => (user ? item.roles.includes(user.role) : false));

  const nav = (
    <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Primary">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring',
                isActive
                  ? 'bg-brand/15 text-brand ring-1 ring-inset ring-brand/30'
                  : 'text-muted hover:bg-surface-2 hover:text-content'
              )
            }
          >
            {Icon && <Icon className="h-[18px] w-[18px] flex-shrink-0" />}
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <Brand />
        {nav}
        <div className="border-t border-border px-5 py-4 text-[11px] text-muted">TransitOps © 2026 · RBAC enabled</div>
      </aside>

      {/* Mobile drawer */}
      <div className={cn('fixed inset-0 z-40 lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}>
        <div
          className={cn('absolute inset-0 bg-black/60 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
          onClick={onClose}
          aria-hidden
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-surface shadow-pop transition-transform',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex items-center justify-between">
            <Brand />
            <button onClick={onClose} className="focus-ring mr-3 rounded-lg p-1.5 text-muted hover:bg-surface-2" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          {nav}
        </aside>
      </div>
    </>
  );
}
