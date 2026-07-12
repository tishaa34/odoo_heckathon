import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tripsApi, type TripInput } from '@/services/api';
import { qk } from '@/services/queryClient';
import type { ListParams } from '@/types';
import { toastError, toastSuccess } from './useMutationToast';

export function useTrips(params?: ListParams) {
  return useQuery({
    queryKey: qk.trips(params),
    queryFn: () => tripsApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useTripHistory(id: string | null) {
  return useQuery({
    queryKey: qk.tripHistory(id ?? ''),
    queryFn: () => tripsApi.history(id as string),
    enabled: !!id,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.tripsAll });
    qc.invalidateQueries({ queryKey: qk.vehiclesAll });
    qc.invalidateQueries({ queryKey: qk.driversAll });
    qc.invalidateQueries({ queryKey: qk.dashboard });
  };
}

export function useCreateTrip() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: TripInput) => tripsApi.create(body),
    onSuccess: () => {
      invalidate();
      toastSuccess('Trip created & dispatched — vehicle and driver reserved.');
    },
    onError: (e) => toastError(e),
  });
}

/** Generic lifecycle action hook (start / complete / cancel). */
export function useTripAction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'start' | 'complete' | 'cancel'; reason?: string }) => {
      switch (action) {
        case 'start':
          return tripsApi.start(id);
        case 'complete':
          return tripsApi.complete(id);
        case 'cancel':
          return tripsApi.cancel(id, reason);
      }
    },
    onSuccess: (_data, vars) => {
      invalidate();
      const verb = { start: 'started', complete: 'completed', cancel: 'cancelled' }[vars.action];
      toastSuccess(`Trip ${verb}.`);
    },
    onError: (e) => toastError(e),
  });
}
