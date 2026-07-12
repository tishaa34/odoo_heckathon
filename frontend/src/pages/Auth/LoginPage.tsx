import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Field';
import { ROLE_HOME, ROLE_LABELS } from '@/constants';
import type { Role } from '@/types';

const schema = z.object({
  email: z.string().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  remember: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

const DEMO: { role: Role; email: string }[] = [
  { role: 'FLEET_MANAGER', email: 'manager@transitops.com' },
  { role: 'DRIVER', email: 'driver@transitops.com' },
  { role: 'SAFETY_OFFICER', email: 'safety@transitops.com' },
  { role: 'FINANCIAL_ANALYST', email: 'finance@transitops.com' },
];

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: true },
  });

  if (isAuthenticated && user) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
    return <Navigate to={from || ROLE_HOME[user.role]} replace />;
  }

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const u = await login(values.email, values.password);
      navigate(ROLE_HOME[u.role], { replace: true });
    } catch (err) {
      setServerError((err as { message?: string })?.message ?? 'Login failed. Please try again.');
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'Password123!', { shouldValidate: true });
    setServerError(null);
  };

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-surface p-12 lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold text-content">TransitOps</p>
            <p className="text-xs uppercase tracking-wider text-muted">Smart Transport Operations</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight text-content">
            Run your fleet from a<br />
            <span className="text-brand">single control room.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm text-muted">
            Dispatch trips, track vehicles & drivers, log maintenance and fuel, and see live operational costs — with role-based
            access for your whole team.
          </p>
        </div>

        <p className="relative text-xs text-muted">TransitOps © 2026</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
              <Truck className="h-6 w-6" />
            </div>
            <p className="text-lg font-bold text-content">TransitOps</p>
          </div>

          <h2 className="text-2xl font-bold text-content">Sign in to your account</h2>
          <p className="mt-1 text-sm text-muted">Enter your credentials to continue.</p>

          {serverError && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-status-suspended/40 bg-status-suspended/10 px-3 py-2.5 text-sm text-status-suspended" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@transitops.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="focus-ring absolute right-3 top-[34px] text-muted hover:text-content"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input type="checkbox" className="h-4 w-4 rounded border-border bg-surface-2 text-brand focus-ring" {...register('remember')} />
                Remember me
              </label>
            </div>

            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className="mt-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Demo accounts · one-click fill</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.role}
                  onClick={() => fillDemo(d.email)}
                  className="focus-ring rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-xs transition-colors hover:border-brand hover:text-brand"
                >
                  <span className="block font-semibold text-content">{ROLE_LABELS[d.role]}</span>
                  <span className="block truncate text-muted">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
