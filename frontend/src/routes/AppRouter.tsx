import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoadingBlock } from '@/components/common/Feedback';
import LoginPage from '@/pages/Auth/LoginPage';
import { UnauthorizedPage, NotFoundPage } from '@/pages/Misc/ErrorPages';

// Lazy-load feature pages for a smaller initial bundle.
const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'));
const VehiclesPage = lazy(() => import('@/pages/Vehicles/VehiclesPage'));
const DriversPage = lazy(() => import('@/pages/Drivers/DriversPage'));
const TripsPage = lazy(() => import('@/pages/Trips/TripsPage'));
const MaintenancePage = lazy(() => import('@/pages/Maintenance/MaintenancePage'));
const FuelPage = lazy(() => import('@/pages/Fuel/FuelPage'));
const AnalyticsPage = lazy(() => import('@/pages/Analytics/AnalyticsPage'));
const SettingsPage = lazy(() => import('@/pages/Settings/SettingsPage'));

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingBlock className="min-h-[60vh]" />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Lazy><DashboardPage /></Lazy>} />
          <Route path="/settings" element={<Lazy><SettingsPage /></Lazy>} />

          <Route element={<ProtectedRoute roles={['FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST']} />}>
            <Route path="/vehicles" element={<Lazy><VehiclesPage /></Lazy>} />
          </Route>
          <Route element={<ProtectedRoute roles={['FLEET_MANAGER', 'SAFETY_OFFICER']} />}>
            <Route path="/drivers" element={<Lazy><DriversPage /></Lazy>} />
          </Route>
          <Route element={<ProtectedRoute roles={['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER']} />}>
            <Route path="/trips" element={<Lazy><TripsPage /></Lazy>} />
          </Route>
          <Route element={<ProtectedRoute roles={['FLEET_MANAGER', 'SAFETY_OFFICER']} />}>
            <Route path="/maintenance" element={<Lazy><MaintenancePage /></Lazy>} />
          </Route>
          <Route element={<ProtectedRoute roles={['FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DRIVER']} />}>
            <Route path="/fuel" element={<Lazy><FuelPage /></Lazy>} />
          </Route>
          <Route element={<ProtectedRoute roles={['FLEET_MANAGER', 'FINANCIAL_ANALYST']} />}>
            <Route path="/analytics" element={<Lazy><AnalyticsPage /></Lazy>} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
