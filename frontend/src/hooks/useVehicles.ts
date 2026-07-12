import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi, type VehicleInput } from '@/services/api';
import { qk } from '@/services/queryClient';
import type { ListParams } from '@/types';
import { toastError, toastSuccess } from './useMutationToast';

export function useVehicles(params?: ListParams) {
  return useQuery({
    queryKey: qk.vehicles(params),
    queryFn: () => vehiclesApi.list(params),
    placeholderData: (prev) => prev,
  });
}

/** All available vehicles for dispatch pickers (client-side filtered). */
export function useAvailableVehicles() {
  return useQuery({
    queryKey: qk.vehicles({ status: 'AVAILABLE', limit: 100 }),
    queryFn: () => vehiclesApi.list({ status: 'AVAILABLE', limit: 100 }),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.vehiclesAll });
    qc.invalidateQueries({ queryKey: qk.dashboard });
  };
}

export function useCreateVehicle() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: VehicleInput) => vehiclesApi.create(body),
    onSuccess: () => {
      invalidate();
      toastSuccess('Vehicle added successfully.');
    },
    onError: (e) => toastError(e),
  });
}

export function useUpdateVehicle() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<VehicleInput> }) => vehiclesApi.update(id, body),
    onSuccess: () => {
      invalidate();
      toastSuccess('Vehicle updated.');
    },
    onError: (e) => toastError(e),
  });
}

export function useRetireVehicle() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.retire(id),
    onSuccess: () => {
      invalidate();
      toastSuccess('Vehicle retired.');
    },
    onError: (e) => toastError(e),
  });
}

export function useDeleteVehicle() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.remove(id),
    onSuccess: () => {
      invalidate();
      toastSuccess('Vehicle deleted.');
    },
    onError: (e) => toastError(e),
  });
}
