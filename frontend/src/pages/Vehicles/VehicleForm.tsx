import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Field';
import { useCreateVehicle, useUpdateVehicle } from '@/hooks/useVehicles';
import { toNumber } from '@/utils/format';
import type { Vehicle } from '@/types';

// Registration format: 2 letters, 2 digits, 2 letters, 4 digits — e.g. AB02TH1234.
const REGISTRATION_RE = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/;

const schema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => REGISTRATION_RE.test(v), 'Please enter a valid registration number!'),
  make: z.string().trim().min(1, 'Make is required.').max(50),
  model: z.string().trim().min(1, 'Model is required.').max(50),
  year: z.coerce.number().int().min(1950, 'Too old.').max(2100).optional().or(z.literal('' as unknown as number)),
  capacityKg: z.coerce.number({ invalid_type_error: 'Enter a number.' }).positive('Capacity must be greater than zero.').max(100000),
  odometerKm: z.coerce
    .number({ invalid_type_error: 'Enter a number.' })
    .min(0, 'Cannot be negative.')
    .max(10000000, 'Odometer must be between 0 and 10,000,000 km.')
    .optional(),
  acquisitionCost: z.coerce
    .number({ invalid_type_error: 'Enter a number.' })
    .min(0, 'Cannot be negative.')
    .max(100000000, 'Cost is too large.')
    .optional(),
});
type FormValues = z.infer<typeof schema>;

export function VehicleForm({ open, onClose, vehicle }: { open: boolean; onClose: () => void; vehicle?: Vehicle | null }) {
  const isEdit = !!vehicle;
  const create = useCreateVehicle();
  const update = useUpdateVehicle();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: vehicle
      ? {
          registrationNumber: vehicle.registrationNumber,
          make: vehicle.make,
          model: vehicle.model,
          year: (vehicle.year ?? undefined) as number,
          capacityKg: toNumber(vehicle.capacityKg),
          odometerKm: toNumber(vehicle.odometerKm),
          acquisitionCost: toNumber(vehicle.acquisitionCost),
        }
      : undefined,
  });

  const applyFieldErrors = (err: unknown) => {
    const fieldErrors = (err as { fieldErrors?: { field: string; message: string }[] })?.fieldErrors;
    fieldErrors?.forEach((fe) => {
      const key = fe.field.replace('body.', '') as keyof FormValues;
      setError(key, { message: fe.message });
    });
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      registrationNumber: values.registrationNumber,
      make: values.make,
      model: values.model,
      year: values.year ? Number(values.year) : undefined,
      capacityKg: Number(values.capacityKg),
      odometerKm: values.odometerKm != null ? Number(values.odometerKm) : undefined,
      acquisitionCost: values.acquisitionCost != null ? Number(values.acquisitionCost) : undefined,
    };
    try {
      if (isEdit && vehicle) {
        await update.mutateAsync({ id: vehicle.id, body: payload });
      } else {
        await create.mutateAsync(payload);
      }
      reset();
      onClose();
    } catch (err) {
      applyFieldErrors(err);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
      description={isEdit ? 'Update vehicle master data.' : 'Register a new vehicle in the fleet.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="vehicle-form" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </>
      }
    >
      <form id="vehicle-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Registration Number"
          placeholder="AB02TH1234"
          required
          error={errors.registrationNumber?.message}
          hint="Format: AB02TH1234 (2 letters, 2 digits, 2 letters, 4 digits). Must be unique."
          {...register('registrationNumber')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Make" placeholder="Tata" required error={errors.make?.message} {...register('make')} />
          <Input label="Model" placeholder="Ace Gold" required error={errors.model?.message} {...register('model')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Year" type="number" placeholder="2022" error={errors.year?.message} {...register('year')} />
          <Input
            label="Capacity (kg)"
            type="number"
            placeholder="500"
            required
            error={errors.capacityKg?.message}
            {...register('capacityKg')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Odometer (km)"
            type="number"
            placeholder="0"
            hint="0 – 10,000,000"
            error={errors.odometerKm?.message}
            {...register('odometerKm')}
          />
          <Input
            label="Vehicle Cost (₹)"
            type="number"
            placeholder="620000"
            error={errors.acquisitionCost?.message}
            {...register('acquisitionCost')}
          />
        </div>
      </form>
    </Modal>
  );
}
