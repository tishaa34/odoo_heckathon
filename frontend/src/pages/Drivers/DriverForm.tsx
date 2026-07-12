import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input, Select } from '@/components/common/Field';
import { useCreateDriver, useUpdateDriver } from '@/hooks/useDrivers';
import { toDateInputValue } from '@/utils/format';
import type { Driver } from '@/types';

const schema = z.object({
  name: z.string().trim().min(2, 'Name is required.').max(100),
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email.'),
  phone: z.string().trim().regex(/^[+]?[\d\s-]{7,20}$/, 'Enter a valid phone number.'),
  licenseNumber: z.string().trim().min(3, 'License number is too short.').max(30).toUpperCase(),
  licenseExpiry: z.string().min(1, 'License expiry is required.'),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']).optional(),
});
type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OFF_DUTY', label: 'Off Duty' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export function DriverForm({ open, onClose, driver }: { open: boolean; onClose: () => void; driver?: Driver | null }) {
  const isEdit = !!driver;
  const create = useCreateDriver();
  const update = useUpdateDriver();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: driver
      ? {
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          licenseExpiry: toDateInputValue(driver.licenseExpiry),
          status: driver.status,
        }
      : undefined,
  });

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      licenseNumber: values.licenseNumber,
      licenseExpiry: new Date(values.licenseExpiry).toISOString(),
      ...(isEdit ? { status: values.status } : {}),
    };
    try {
      if (isEdit && driver) {
        await update.mutateAsync({ id: driver.id, body: payload });
      } else {
        await create.mutateAsync(payload);
      }
      reset();
      onClose();
    } catch (err) {
      (err as { fieldErrors?: { field: string; message: string }[] })?.fieldErrors?.forEach((fe) =>
        setError(fe.field.replace('body.', '') as keyof FormValues, { message: fe.message })
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Driver' : 'Add Driver'}
      description={isEdit ? 'Update driver profile & safety status.' : 'Register a new driver.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="driver-form" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Driver'}
          </Button>
        </>
      }
    >
      <form id="driver-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Full Name" placeholder="Rajesh Kumar" required error={errors.name?.message} {...register('name')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" placeholder="rajesh@transitops.com" required error={errors.email?.message} {...register('email')} />
          <Input label="Phone" placeholder="+91 98765 43210" required error={errors.phone?.message} {...register('phone')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="License Number" placeholder="DL0120210001" required error={errors.licenseNumber?.message} {...register('licenseNumber')} />
          <Input label="License Expiry" type="date" required error={errors.licenseExpiry?.message} {...register('licenseExpiry')} />
        </div>
        {isEdit && (
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            hint="Suspended drivers are blocked from trip assignment."
            {...register('status')}
          />
        )}
      </form>
    </Modal>
  );
}
