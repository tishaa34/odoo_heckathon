import { DriverStatus, TripStatus, VehicleStatus } from '@prisma/client';
import { ApiError } from '../../utils/ApiError';

/**
 * Pure business-rule functions for the trip lifecycle. No I/O — every function
 * takes plain data and either returns/throws. This is what the unit tests target.
 */

export interface VehicleLike {
  id: string;
  status: VehicleStatus;
  isRetired: boolean;
  capacityKg: { toNumber(): number } | number;
}

export interface DriverLike {
  id: string;
  status: DriverStatus;
  licenseExpiry: Date;
}

function toNum(value: { toNumber(): number } | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

/** Validates that a vehicle is eligible to be dispatched. Throws ApiError otherwise. */
export function assertVehicleDispatchable(vehicle: VehicleLike): void {
  if (vehicle.isRetired || vehicle.status === VehicleStatus.RETIRED) {
    throw ApiError.businessRule('Vehicle is retired and cannot be dispatched.');
  }
  if (vehicle.status === VehicleStatus.IN_SHOP) {
    throw ApiError.businessRule('Vehicle is under maintenance (In Shop) and cannot be dispatched.');
  }
  if (vehicle.status === VehicleStatus.ON_TRIP) {
    throw ApiError.businessRule('Vehicle is already on a trip.');
  }
  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw ApiError.businessRule('Vehicle is not available for dispatch.');
  }
}

/** Validates that a driver is eligible to be dispatched. Throws ApiError otherwise. */
export function assertDriverDispatchable(driver: DriverLike, now: Date = new Date()): void {
  if (driver.status === DriverStatus.SUSPENDED) {
    throw ApiError.businessRule('Driver is suspended and cannot be dispatched.');
  }
  if (driver.status === DriverStatus.OFF_DUTY) {
    throw ApiError.businessRule('Driver is off duty and cannot be dispatched.');
  }
  if (driver.status === DriverStatus.ON_TRIP) {
    throw ApiError.businessRule('Driver is already on a trip.');
  }
  if (driver.status !== DriverStatus.AVAILABLE) {
    throw ApiError.businessRule('Driver is not available for dispatch.');
  }
  if (driver.licenseExpiry.getTime() < now.getTime()) {
    throw ApiError.businessRule("Driver's license has expired and cannot be dispatched.");
  }
}

/** Cargo must never exceed vehicle capacity. */
export function assertCapacity(cargoWeightKg: number, vehicle: VehicleLike): void {
  const capacity = toNum(vehicle.capacityKg);
  if (cargoWeightKg > capacity) {
    throw ApiError.businessRule(
      `Cargo weight (${cargoWeightKg}kg) exceeds vehicle capacity (${capacity}kg).`
    );
  }
}

/** Full pre-dispatch gate: runs every rule in order. */
export function assertDispatchAllowed(
  vehicle: VehicleLike,
  driver: DriverLike,
  cargoWeightKg: number,
  now: Date = new Date()
): void {
  assertVehicleDispatchable(vehicle);
  assertDriverDispatchable(driver, now);
  assertCapacity(cargoWeightKg, vehicle);
}

/** Allowed source states for each trip transition (state machine definition). */
const TRANSITIONS: Record<string, TripStatus[]> = {
  dispatch: [TripStatus.PENDING],
  start: [TripStatus.DISPATCHED],
  complete: [TripStatus.DISPATCHED, TripStatus.IN_PROGRESS],
  cancel: [TripStatus.PENDING, TripStatus.DISPATCHED, TripStatus.IN_PROGRESS],
};

/** Guards illegal state jumps (e.g. completing a PENDING trip). */
export function assertTransitionAllowed(action: keyof typeof TRANSITIONS, current: TripStatus): void {
  const allowed = TRANSITIONS[action];
  if (!allowed.includes(current)) {
    throw ApiError.businessRule(
      `Cannot ${action} a trip in ${current} state. Allowed from: ${allowed.join(', ')}.`
    );
  }
}

/** Whether the vehicle/driver were actively tied up by this trip (need releasing). */
export function tripHoldsResources(status: TripStatus): boolean {
  return status === TripStatus.DISPATCHED || status === TripStatus.IN_PROGRESS;
}
