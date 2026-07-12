import { type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';
import { WRITE_ACCESS } from '@/constants';

/** Renders children only when the current user has one of the allowed roles. */
export function RoleGate({ roles, children, fallback = null }: { roles: Role[]; children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}

/** Convenience hook: can the current user write to a given module? */
export function useCanWrite(module: keyof typeof WRITE_ACCESS): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return WRITE_ACCESS[module]?.includes(user.role) ?? false;
}
