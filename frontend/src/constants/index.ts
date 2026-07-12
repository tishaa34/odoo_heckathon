import type { Role } from '@/types';

export const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const TOKEN_KEYS = {
  access: 'transitops.accessToken',
  refresh: 'transitops.refreshToken',
  user: 'transitops.user',
  theme: 'transitops.theme',
} as const;

export const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: 'Fleet Manager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

export const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));

// Navigation is role-aware. `roles` = who can see the nav entry / access the page.
export interface NavItem {
  to: string;
  label: string;
  icon: string; // lucide icon name key (resolved in Sidebar)
  roles: Role[];
}

const ALL: Role[] = ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'];

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: ALL },
  { to: '/vehicles', label: 'Fleet', icon: 'Truck', roles: ['FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST'] },
  { to: '/drivers', label: 'Drivers', icon: 'Users', roles: ['FLEET_MANAGER', 'SAFETY_OFFICER'] },
  { to: '/trips', label: 'Trips', icon: 'Route', roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER'] },
  { to: '/maintenance', label: 'Maintenance', icon: 'Wrench', roles: ['FLEET_MANAGER', 'SAFETY_OFFICER'] },
  { to: '/fuel', label: 'Fuel & Expenses', icon: 'Fuel', roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DRIVER'] },
  { to: '/analytics', label: 'Analytics', icon: 'BarChart3', roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
  { to: '/settings', label: 'Settings', icon: 'Settings', roles: ALL },
];

// Landing route per role after login (first page they are allowed to see).
export const ROLE_HOME: Record<Role, string> = {
  FLEET_MANAGER: '/dashboard',
  DRIVER: '/dashboard',
  SAFETY_OFFICER: '/dashboard',
  FINANCIAL_ANALYST: '/dashboard',
};

// Which roles may perform write actions per module (mirrors backend authorize()).
export const WRITE_ACCESS: Record<string, Role[]> = {
  vehicles: ['FLEET_MANAGER'],
  drivers: ['FLEET_MANAGER', 'SAFETY_OFFICER'],
  trips: ['FLEET_MANAGER', 'DRIVER'],
  maintenance: ['FLEET_MANAGER', 'SAFETY_OFFICER'],
  fuel: ['FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DRIVER'],
  expenses: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'],
};

export type StatusTone = 'green' | 'blue' | 'orange' | 'gray' | 'red' | 'yellow';

export const VEHICLE_STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  AVAILABLE: { label: 'Available', tone: 'green' },
  ON_TRIP: { label: 'On Trip', tone: 'blue' },
  IN_SHOP: { label: 'In Shop', tone: 'orange' },
  RETIRED: { label: 'Retired', tone: 'gray' },
};

export const DRIVER_STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  AVAILABLE: { label: 'Available', tone: 'green' },
  ON_TRIP: { label: 'On Trip', tone: 'blue' },
  OFF_DUTY: { label: 'Off Duty', tone: 'gray' },
  SUSPENDED: { label: 'Suspended', tone: 'red' },
};

export const TRIP_STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  PENDING: { label: 'Pending', tone: 'yellow' },
  DISPATCHED: { label: 'Dispatched', tone: 'blue' },
  IN_PROGRESS: { label: 'In Progress', tone: 'blue' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
};

export const MAINTENANCE_STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  OPEN: { label: 'In Shop', tone: 'orange' },
  CLOSED: { label: 'Completed', tone: 'green' },
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  FUEL: 'Fuel',
  MAINTENANCE: 'Maintenance',
  TOLL: 'Toll',
  MISC: 'Misc',
};

export const CHART_COLORS = ['#d97706', '#2563eb', '#16a34a', '#dc2626', '#9333ea', '#0891b2'];
