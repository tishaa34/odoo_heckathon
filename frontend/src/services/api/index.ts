import { http } from '../http';
import type {
  ApiEnvelope,
  AuthResult,
  CostSummary,
  DashboardMetrics,
  Driver,
  DriverAnalytics,
  Expense,
  ExpenseCategory,
  FuelLog,
  ListParams,
  MaintenanceLog,
  Paginated,
  Trip,
  TripHistoryEntry,
  User,
  Vehicle,
  VehicleRoi,
} from '@/types';

/** Unwraps a single-object envelope. */
async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

/** Unwraps a paginated envelope (data = items[], meta at top level). */
async function unwrapList<T>(promise: Promise<{ data: ApiEnvelope<T[]> }>): Promise<Paginated<T>> {
  const res = await promise;
  return {
    items: res.data.data,
    meta: res.data.meta ?? { page: 1, limit: res.data.data.length, total: res.data.data.length, totalPages: 1, hasNext: false, hasPrev: false },
  };
}

function clean(params?: ListParams): Record<string, unknown> {
  if (!params) return {};
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null));
}

// ─── Auth ───
export const authApi = {
  login: (email: string, password: string) =>
    unwrap<AuthResult>(http.post('/auth/login', { email, password })),
  me: () => unwrap<User>(http.get('/auth/me')),
  logout: (refreshToken: string) => http.post('/auth/logout', { refreshToken }),
  register: (body: { name: string; email: string; password: string; role: string }) =>
    unwrap<User>(http.post('/auth/register', body)),
};

// ─── Vehicles ───
export interface VehicleInput {
  registrationNumber: string;
  make: string;
  model: string;
  year?: number;
  capacityKg: number;
  odometerKm?: number;
}
export const vehiclesApi = {
  list: (params?: ListParams) => unwrapList<Vehicle>(http.get('/vehicles', { params: clean(params) })),
  get: (id: string) => unwrap<Vehicle>(http.get(`/vehicles/${id}`)),
  create: (body: VehicleInput) => unwrap<Vehicle>(http.post('/vehicles', body)),
  update: (id: string, body: Partial<VehicleInput>) => unwrap<Vehicle>(http.patch(`/vehicles/${id}`, body)),
  retire: (id: string) => unwrap<Vehicle>(http.post(`/vehicles/${id}/retire`)),
  remove: (id: string) => http.delete(`/vehicles/${id}`),
};

// ─── Drivers ───
export interface DriverInput {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status?: string;
}
export const driversApi = {
  list: (params?: ListParams) => unwrapList<Driver>(http.get('/drivers', { params: clean(params) })),
  get: (id: string) => unwrap<Driver>(http.get(`/drivers/${id}`)),
  create: (body: DriverInput) => unwrap<Driver>(http.post('/drivers', body)),
  update: (id: string, body: Partial<DriverInput>) => unwrap<Driver>(http.patch(`/drivers/${id}`, body)),
  remove: (id: string) => http.delete(`/drivers/${id}`),
};

// ─── Trips ───
export interface TripInput {
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  cargoWeightKg: number;
  scheduledAt?: string;
  distanceKm?: number;
  revenue?: number;
}
export const tripsApi = {
  list: (params?: ListParams) => unwrapList<Trip>(http.get('/trips', { params: clean(params) })),
  get: (id: string) => unwrap<Trip>(http.get(`/trips/${id}`)),
  history: (id: string) => unwrap<TripHistoryEntry[]>(http.get(`/trips/${id}/history`)),
  create: (body: TripInput) => unwrap<Trip>(http.post('/trips', body)),
  dispatch: (id: string) => unwrap<Trip>(http.post(`/trips/${id}/dispatch`)),
  start: (id: string) => unwrap<Trip>(http.post(`/trips/${id}/start`)),
  complete: (id: string) => unwrap<Trip>(http.post(`/trips/${id}/complete`)),
  cancel: (id: string, reason?: string) => unwrap<Trip>(http.post(`/trips/${id}/cancel`, { reason })),
};

// ─── Maintenance ───
export interface MaintenanceInput {
  vehicleId: string;
  type: string;
  description?: string;
  cost?: number;
}
export const maintenanceApi = {
  list: (params?: ListParams) => unwrapList<MaintenanceLog>(http.get('/maintenance', { params: clean(params) })),
  open: (body: MaintenanceInput) => unwrap<MaintenanceLog>(http.post('/maintenance', body)),
  close: (id: string, cost?: number) => unwrap<MaintenanceLog>(http.patch(`/maintenance/${id}/close`, { cost })),
};

// ─── Fuel ───
export interface FuelInput {
  vehicleId: string;
  tripId?: string;
  liters: number;
  cost: number;
  odometerKm?: number;
  filledAt?: string;
}
export const fuelApi = {
  list: (params?: ListParams) => unwrapList<FuelLog>(http.get('/fuel', { params: clean(params) })),
  create: (body: FuelInput) => unwrap<FuelLog>(http.post('/fuel', body)),
};

// ─── Expenses ───
export interface ExpenseInput {
  vehicleId?: string;
  tripId?: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  incurredAt?: string;
}
export const expensesApi = {
  list: (params?: ListParams) => unwrapList<Expense>(http.get('/expenses', { params: clean(params) })),
  create: (body: ExpenseInput) => unwrap<Expense>(http.post('/expenses', body)),
};

// ─── Analytics ───
export const analyticsApi = {
  dashboard: () => unwrap<DashboardMetrics>(http.get('/analytics/dashboard')),
  costs: () => unwrap<CostSummary>(http.get('/analytics/costs')),
  drivers: () => unwrap<DriverAnalytics>(http.get('/analytics/drivers')),
  vehicleRoi: (id: string) => unwrap<VehicleRoi>(http.get(`/analytics/vehicle/${id}/roi`)),
};
