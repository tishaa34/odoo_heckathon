import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/api';
import { qk } from '@/services/queryClient';

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: () => analyticsApi.dashboard() });
}

export function useCosts(enabled = true) {
  return useQuery({ queryKey: qk.costs, queryFn: () => analyticsApi.costs(), enabled });
}

export function useDriverAnalytics(enabled = true) {
  return useQuery({ queryKey: qk.driverAnalytics, queryFn: () => analyticsApi.drivers(), enabled });
}
