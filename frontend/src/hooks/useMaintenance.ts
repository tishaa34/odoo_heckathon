import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi, type MaintenanceInput } from '@/services/api';
import { qk } from '@/services/queryClient';
import type { ListParams } from '@/types';
import { toastError, toastSuccess } from './useMutationToast';

export function useMaintenance(params?: ListParams) {
  return useQuery({
    queryKey: qk.maintenance(params),
    queryFn: () => maintenanceApi.list(params),
    placeholderData: (prev) => prev,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.maintenanceAll });
    qc.invalidateQueries({ queryKey: qk.vehiclesAll });
    qc.invalidateQueries({ queryKey: qk.dashboard });
  };
}

export function useOpenMaintenance() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: MaintenanceInput) => maintenanceApi.open(body),
    onSuccess: () => {
      invalidate();
      toastSuccess('Service logged. Vehicle moved to In Shop.');
    },
    onError: (e) => toastError(e),
  });
}

export function useCloseMaintenance() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, cost }: { id: string; cost?: number }) => maintenanceApi.close(id, cost),
    onSuccess: () => {
      invalidate();
      toastSuccess('Maintenance closed. Vehicle restored to Available.');
    },
    onError: (e) => toastError(e),
  });
}
