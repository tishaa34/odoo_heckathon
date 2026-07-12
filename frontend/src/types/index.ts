// Domain types mirroring the TransitOps backend (Prisma models + API DTOs).

export type Role = 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';
export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
export type TripStatus = 'PENDING' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type MaintenanceStatus = 'OPEN' | 'CLOSED';
export type ExpenseCategory = 'FUEL' | 'MAINTENANCE' | 'TOLL' | 'MISC';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number | null;
  capacityKg: string | number;
  odometerKm: string | number;
  status: VehicleStatus;
  isRetired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: DriverStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TripVehicleRef {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  status: VehicleStatus;
}
export interface TripDriverRef {
  id: string;
  name: string;
  licenseNumber: string;
  status: DriverStatus;
}

export interface Trip {
  id: string;
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  cargoWeightKg: string | number;
  distanceKm: string | number | null;
  revenue: string | number;
  status: TripStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: TripVehicleRef;
  driver?: TripDriverRef;
}

export interface TripHistoryEntry {
  id: string;
  tripId: string;
  fromStatus: TripStatus | null;
  toStatus: TripStatus;
  reason: string | null;
  changedById: string | null;
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: string;
  description: string | null;
  cost: string | number;
  status: MaintenanceStatus;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: Pick<Vehicle, 'id' | 'registrationNumber' | 'make' | 'model' | 'status'>;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId: string | null;
  liters: string | number;
  cost: string | number;
  odometerKm: string | number | null;
  filledAt: string;
  createdAt: string;
  vehicle?: Pick<Vehicle, 'id' | 'registrationNumber'>;
}

export interface Expense {
  id: string;
  vehicleId: string | null;
  tripId: string | null;
  category: ExpenseCategory;
  amount: string | number;
  note: string | null;
  incurredAt: string;
  createdAt: string;
  vehicle?: Pick<Vehicle, 'id' | 'registrationNumber'>;
}

// ── Analytics DTOs ──
export interface DashboardMetrics {
  vehicles: { total: number; active: number; available: number; onTrip: number; inShop: number; retired: number };
  drivers: { total: number; available: number; onDuty: number; onTrip: number; offDuty: number; suspended: number };
  trips: { total: number; pending: number; active: number; completed: number; cancelled: number };
  financials: {
    fuelCost: number;
    maintenanceCost: number;
    otherExpenses: number;
    totalOperationalCost: number;
    totalRevenue: number;
    netProfit: number;
  };
  fleetUtilization: number;
}

export interface CostSummary {
  fuelCost: number;
  fuelLiters: number;
  maintenanceCost: number;
  expenseByCategory: { category: ExpenseCategory; amount: number }[];
  totalOperationalCost: number;
}

export interface VehicleRoi {
  vehicleId: string;
  registrationNumber: string;
  completedTrips: number;
  totalRevenue: number;
  costBreakdown: { fuelCost: number; maintenanceCost: number; otherExpenses: number };
  operatingCost: number;
  netProfit: number;
  roiPercent: number | null;
  fuelEfficiencyKmPerLitre: number | null;
}

export interface DriverAnalytics {
  total: number;
  onDuty: number;
  driverUtilizationPercent: number;
  byStatus: Partial<Record<DriverStatus, number>>;
  topDrivers: { id: string; name: string; status: DriverStatus; completedTrips: number }[];
}

// ── API envelope ──
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  code: string;
  errors?: FieldError[];
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  [key: string]: unknown;
}
