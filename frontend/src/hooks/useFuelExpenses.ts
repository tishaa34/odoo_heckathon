import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expensesApi, fuelApi, type ExpenseInput, type FuelInput } from '@/services/api';
import { qk } from '@/services/queryClient';
import type { ListParams } from '@/types';
import { toastError, toastSuccess } from './useMutationToast';

export function useFuelLogs(params?: ListParams) {
  return useQuery({
    queryKey: qk.fuel(params),
    queryFn: () => fuelApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useExpenses(params?: ListParams) {
  return useQuery({
    queryKey: qk.expenses(params),
    queryFn: () => expensesApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateFuelLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: FuelInput) => fuelApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.fuelAll });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.costs });
      toastSuccess('Fuel log recorded.');
    },
    onError: (e) => toastError(e),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ExpenseInput) => expensesApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.expensesAll });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.costs });
      toastSuccess('Expense recorded.');
    },
    onError: (e) => toastError(e),
  });
}
