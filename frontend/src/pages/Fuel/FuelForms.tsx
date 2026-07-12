import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input, Select } from '@/components/common/Field';
import { useCreateFuelLog, useCreateExpense } from '@/hooks/useFuelExpenses';
import { useVehicles } from '@/hooks/useVehicles';
import { EXPENSE_CATEGORY_LABELS } from '@/constants';

function useVehicleOptions() {
  const { data } = useVehicles({ limit: 100 });
  return (data?.items ?? []).map((v) => ({ value: v.id, label: `${v.registrationNumber} · ${v.make} ${v.model}` }));
}

/** Fuel can only be logged for vehicles that are in service (available or on a trip). */
function useFuelableVehicleOptions() {
  const { data } = useVehicles({ limit: 100 });
  return (data?.items ?? [])
    .filter((v) => v.status === 'AVAILABLE' || v.status === 'ON_TRIP')
    .map((v) => ({ value: v.id, label: `${v.registrationNumber} · ${v.make} ${v.model}` }));
}

const fuelSchema = z.object({
  vehicleId: z.string().uuid('Select a vehicle.'),
  liters: z.coerce.number().positive('Enter litres.').max(10000),
  cost: z.coerce.number().positive('Enter cost.').max(1000000),
  odometerKm: z.coerce.number().min(0).optional().or(z.literal('' as unknown as number)),
  filledAt: z.string().optional(),
});
type FuelValues = z.infer<typeof fuelSchema>;

export function LogFuelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const options = useFuelableVehicleOptions();
  const create = useCreateFuelLog();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FuelValues>({ resolver: zodResolver(fuelSchema) });

  const onSubmit = async (v: FuelValues) => {
    await create.mutateAsync({
      vehicleId: v.vehicleId,
      liters: Number(v.liters),
      cost: Number(v.cost),
      odometerKm: v.odometerKm ? Number(v.odometerKm) : undefined,
      filledAt: v.filledAt ? new Date(v.filledAt).toISOString() : undefined,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Fuel"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="fuel-form" loading={isSubmitting}>Save Fuel Log</Button>
        </>
      }
    >
      <form id="fuel-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Select label="Vehicle" placeholder="Select a vehicle" options={options} required error={errors.vehicleId?.message} {...register('vehicleId')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Litres" type="number" step="0.01" placeholder="42" required error={errors.liters?.message} {...register('liters')} />
          <Input label="Cost (₹)" type="number" placeholder="3150" required error={errors.cost?.message} {...register('cost')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Odometer (km)" type="number" placeholder="74000" error={errors.odometerKm?.message} {...register('odometerKm')} />
          <Input label="Date" type="date" error={errors.filledAt?.message} {...register('filledAt')} />
        </div>
      </form>
    </Modal>
  );
}

const expenseSchema = z.object({
  category: z.enum(['FUEL', 'MAINTENANCE', 'TOLL', 'MISC']),
  amount: z.coerce.number().positive('Enter an amount.').max(10000000),
  vehicleId: z.string().uuid().optional().or(z.literal('')),
  note: z.string().trim().max(500).optional(),
  incurredAt: z.string().optional(),
});
type ExpenseValues = z.infer<typeof expenseSchema>;

export function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const options = useVehicleOptions();
  const create = useCreateExpense();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseValues>({ resolver: zodResolver(expenseSchema), defaultValues: { category: 'TOLL' } });

  const onSubmit = async (v: ExpenseValues) => {
    await create.mutateAsync({
      category: v.category,
      amount: Number(v.amount),
      vehicleId: v.vehicleId || undefined,
      note: v.note || undefined,
      incurredAt: v.incurredAt ? new Date(v.incurredAt).toISOString() : undefined,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Expense"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="expense-form" loading={isSubmitting}>Save Expense</Button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            options={Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
            required
            error={errors.category?.message}
            {...register('category')}
          />
          <Input label="Amount (₹)" type="number" placeholder="340" required error={errors.amount?.message} {...register('amount')} />
        </div>
        <Select label="Vehicle (optional)" placeholder="Not linked to a vehicle" options={options} error={errors.vehicleId?.message} {...register('vehicleId')} />
        <Input label="Note" placeholder="Toll plaza / parking / misc" error={errors.note?.message} {...register('note')} />
        <Input label="Date" type="date" error={errors.incurredAt?.message} {...register('incurredAt')} />
      </form>
    </Modal>
  );
}
