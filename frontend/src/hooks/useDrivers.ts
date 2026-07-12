import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driversApi, type DriverInput } from '@/services/api';
import { qk } from '@/services/queryClient';
import type { ListParams } from '@/types';
import { toastError, toastSuccess } from './useMutationToast';

export function useDrivers(params?: ListParams) {
  return useQuery({
    queryKey: qk.drivers(params),
    queryFn: () => driversApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useAvailableDrivers() {
  return useQuery({
    queryKey: qk.drivers({ status: 'AVAILABLE', limit: 100 }),
    queryFn: () => driversApi.list({ status: 'AVAILABLE', limit: 100 }),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.driversAll });
    qc.invalidateQueries({ queryKey: qk.dashboard });
  };
}

export function useCreateDriver() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: DriverInput) => driversApi.create(body),
    onSuccess: () => {
      invalidate();
      toastSuccess('Driver added successfully.');
    },
    onError: (e) => toastError(e),
  });
}

export function useUpdateDriver() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<DriverInput> }) => driversApi.update(id, body),
    onSuccess: () => {
      invalidate();
      toastSuccess('Driver updated.');
    },
    onError: (e) => toastError(e),
  });
}

export function useDeleteDriver() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => driversApi.remove(id),
    onSuccess: () => {
      invalidate();
      toastSuccess('Driver deleted.');
    },
    onError: (e) => toastError(e),
  });
}
