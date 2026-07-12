import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Centralized query keys — keeps invalidation consistent across the app.
export const qk = {
  dashboard: ['dashboard'] as const,
  costs: ['analytics', 'costs'] as const,
  driverAnalytics: ['analytics', 'drivers'] as const,
  vehicleRoi: (id: string) => ['analytics', 'roi', id] as const,
  vehicles: (params?: unknown) => ['vehicles', params] as const,
  vehiclesAll: ['vehicles'] as const,
  drivers: (params?: unknown) => ['drivers', params] as const,
  driversAll: ['drivers'] as const,
  trips: (params?: unknown) => ['trips', params] as const,
  tripsAll: ['trips'] as const,
  tripHistory: (id: string) => ['trips', id, 'history'] as const,
  maintenance: (params?: unknown) => ['maintenance', params] as const,
  maintenanceAll: ['maintenance'] as const,
  fuel: (params?: unknown) => ['fuel', params] as const,
  fuelAll: ['fuel'] as const,
  expenses: (params?: unknown) => ['expenses', params] as const,
  expensesAll: ['expenses'] as const,
};
