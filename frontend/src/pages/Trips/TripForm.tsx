import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, CheckCircle2, PackagePlus } from 'lucide-react';
import { Card, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input, Select } from '@/components/common/Field';
import { useAvailableVehicles } from '@/hooks/useVehicles';
import { useAvailableDrivers } from '@/hooks/useDrivers';
import { useCreateTrip } from '@/hooks/useTrips';
import { isLicenseExpired, number, toNumber } from '@/utils/format';

const schema = z.object({
  origin: z.string().trim().min(2, 'Source is required.').max(120),
  destination: z.string().trim().min(2, 'Destination is required.').max(120),
  vehicleId: z.string().uuid('Select a vehicle.'),
  driverId: z.string().uuid('Select a driver.'),
  cargoWeightKg: z.coerce.number({ invalid_type_error: 'Enter cargo weight.' }).positive('Must be greater than zero.').max(100000),
  distanceKm: z.coerce.number().positive('Must be greater than zero.').max(100000).optional().or(z.literal('' as unknown as number)),
  revenue: z.coerce.number().min(0).optional().or(z.literal('' as unknown as number)),
});
type FormValues = z.infer<typeof schema>;

export function TripForm() {
  const { data: vehiclesData, isLoading: vLoading } = useAvailableVehicles();
  const { data: driversData, isLoading: dLoading } = useAvailableDrivers();
  const createTrip = useCreateTrip();

  const vehicles = vehiclesData?.items ?? [];
  // Drivers eligible for dispatch: available AND license not expired.
  const drivers = (driversData?.items ?? []).filter((d) => !isLicenseExpired(d.licenseExpiry));

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { origin: '', destination: '' } });

  const vehicleId = watch('vehicleId');
  const cargo = watch('cargoWeightKg');

  const selectedVehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);
  const capacity = selectedVehicle ? toNumber(selectedVehicle.capacityKg) : null;
  const cargoNum = Number(cargo) || 0;
  const overCapacity = capacity != null && cargoNum > capacity;
  const capacityOk = capacity != null && cargoNum > 0 && cargoNum <= capacity;

  const onSubmit = async (values: FormValues) => {
    if (overCapacity) return;
    try {
      await createTrip.mutateAsync({
        origin: values.origin,
        destination: values.destination,
        vehicleId: values.vehicleId,
        driverId: values.driverId,
        cargoWeightKg: Number(values.cargoWeightKg),
        distanceKm: values.distanceKm ? Number(values.distanceKm) : undefined,
        revenue: values.revenue ? Number(values.revenue) : undefined,
      });
      reset();
    } catch (err) {
      (err as { fieldErrors?: { field: string; message: string }[] })?.fieldErrors?.forEach((fe) =>
        setError(fe.field.replace('body.', '') as keyof FormValues, { message: fe.message })
      );
    }
  };

  const vehicleOptions = vehicles.map((v) => ({
    value: v.id,
    label: `${v.registrationNumber} · ${v.make} ${v.model} (${number(v.capacityKg)} kg)`,
  }));
  const driverOptions = drivers.map((d) => ({ value: d.id, label: `${d.name} · ${d.licenseNumber}` }));

  return (
    <Card>
      <CardHeader title="Create Trip" subtitle="Vehicle and driver are reserved (On Trip) immediately on creation." />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Source" placeholder="Gandhinagar Depot" required error={errors.origin?.message} {...register('origin')} />
          <Input label="Destination" placeholder="Ahmedabad Hub" required error={errors.destination?.message} {...register('destination')} />
        </div>

        <Select
          label="Vehicle (available only)"
          placeholder={vLoading ? 'Loading…' : vehicles.length ? 'Select a vehicle' : 'No available vehicles'}
          options={vehicleOptions}
          required
          error={errors.vehicleId?.message}
          {...register('vehicleId')}
        />

        <Select
          label="Driver (available only)"
          placeholder={dLoading ? 'Loading…' : drivers.length ? 'Select a driver' : 'No eligible drivers'}
          options={driverOptions}
          required
          hint="Drivers with expired licenses are excluded."
          error={errors.driverId?.message}
          {...register('driverId')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Cargo (kg)" type="number" placeholder="700" required error={errors.cargoWeightKg?.message} {...register('cargoWeightKg')} />
          <Input label="Distance (km)" type="number" placeholder="38" error={errors.distanceKm?.message} {...register('distanceKm')} />
          <Input label="Revenue (₹)" type="number" placeholder="0" error={errors.revenue?.message} {...register('revenue')} />
        </div>

        {/* Live capacity validation */}
        {selectedVehicle && cargoNum > 0 && (
          <div
            className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
              overCapacity
                ? 'border-status-suspended/40 bg-status-suspended/10 text-status-suspended'
                : 'border-status-available/40 bg-status-available/10 text-status-available'
            }`}
          >
            {overCapacity ? <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />}
            <div>
              <p>
                Vehicle capacity: <strong>{number(capacity)} kg</strong> · Cargo: <strong>{number(cargoNum)} kg</strong>
              </p>
              {overCapacity ? (
                <p className="font-semibold">Capacity exceeded by {number(cargoNum - (capacity ?? 0))} kg — reduce cargo to proceed.</p>
              ) : (
                capacityOk && <p>Within capacity — good to go.</p>
              )}
            </div>
          </div>
        )}

        <Button type="submit" fullWidth loading={isSubmitting} disabled={overCapacity}>
          <PackagePlus className="h-4 w-4" />
          {overCapacity ? 'Capacity exceeded' : 'Create & Dispatch Trip'}
        </Button>
      </form>
    </Card>
  );
}
