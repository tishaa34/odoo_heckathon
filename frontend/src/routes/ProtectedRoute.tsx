import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingBlock } from '@/components/common/Feedback';
import type { Role } from '@/types';

/** Gate: requires authentication; optionally requires a specific role set. */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg">
        <LoadingBlock label="Preparing your workspace…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
