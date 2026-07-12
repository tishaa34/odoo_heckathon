import { describe, it, expect } from 'vitest';
import { VehicleStatus, DriverStatus, TripStatus } from '@prisma/client';
import {
  assertVehicleDispatchable,
  assertDriverDispatchable,
  assertCapacity,
  assertDispatchAllowed,
  assertTransitionAllowed,
  tripHoldsResources,
  VehicleLike,
  DriverLike,
} from '../src/modules/trip/trip.rules';
import { ApiError } from '../src/utils/ApiError';

const vehicle = (over: Partial<VehicleLike> = {}): VehicleLike => ({
  id: 'v1',
  status: VehicleStatus.AVAILABLE,
  isRetired: false,
  capacityKg: 20000,
  ...over,
});

const driver = (over: Partial<DriverLike> = {}): DriverLike => ({
  id: 'd1',
  status: DriverStatus.AVAILABLE,
  licenseExpiry: new Date(Date.now() + 86_400_000 * 30), // +30 days
  ...over,
});

describe('Vehicle dispatch eligibility', () => {
  it('accepts an available, non-retired vehicle', () => {
    expect(() => assertVehicleDispatchable(vehicle())).not.toThrow();
  });

  it('rejects a retired vehicle', () => {
    expect(() => assertVehicleDispatchable(vehicle({ isRetired: true, status: VehicleStatus.RETIRED }))).toThrow(
      /retired/i
    );
  });

  it('rejects an in-shop (under maintenance) vehicle', () => {
    expect(() => assertVehicleDispatchable(vehicle({ status: VehicleStatus.IN_SHOP }))).toThrow(/maintenance/i);
  });

  it('rejects a vehicle already on a trip', () => {
    expect(() => assertVehicleDispatchable(vehicle({ status: VehicleStatus.ON_TRIP }))).toThrow(/already on a trip/i);
  });

  it('throws a 422 business-rule ApiError', () => {
    try {
      assertVehicleDispatchable(vehicle({ status: VehicleStatus.IN_SHOP }));
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).statusCode).toBe(422);
    }
  });
});

describe('Driver dispatch eligibility', () => {
  it('accepts an available driver with a valid license', () => {
    expect(() => assertDriverDispatchable(driver())).not.toThrow();
  });

  it('rejects a suspended driver', () => {
    expect(() => assertDriverDispatchable(driver({ status: DriverStatus.SUSPENDED }))).toThrow(/suspended/i);
  });

  it('rejects an off-duty driver', () => {
    expect(() => assertDriverDispatchable(driver({ status: DriverStatus.OFF_DUTY }))).toThrow(/off duty/i);
  });

  it('rejects a driver already on a trip', () => {
    expect(() => assertDriverDispatchable(driver({ status: DriverStatus.ON_TRIP }))).toThrow(/already on a trip/i);
  });

  it('rejects a driver with an expired license', () => {
    const expired = driver({ licenseExpiry: new Date(Date.now() - 86_400_000) });
    expect(() => assertDriverDispatchable(expired)).toThrow(/license has expired/i);
  });
});

describe('Cargo capacity', () => {
  it('accepts cargo at exactly capacity', () => {
    expect(() => assertCapacity(20000, vehicle({ capacityKg: 20000 }))).not.toThrow();
  });

  it('rejects cargo exceeding capacity', () => {
    expect(() => assertCapacity(25000, vehicle({ capacityKg: 20000 }))).toThrow(/exceeds vehicle capacity/i);
  });

  it('works with Prisma Decimal-like capacity', () => {
    const decimalCapacity = { toNumber: () => 15000 };
    expect(() => assertCapacity(16000, vehicle({ capacityKg: decimalCapacity }))).toThrow(/exceeds/i);
  });
});

describe('Full dispatch gate', () => {
  it('passes when everything is valid', () => {
    expect(() => assertDispatchAllowed(vehicle(), driver(), 18000)).not.toThrow();
  });

  it('fails fast on the first violated rule (vehicle before driver)', () => {
    expect(() =>
      assertDispatchAllowed(vehicle({ status: VehicleStatus.IN_SHOP }), driver({ status: DriverStatus.SUSPENDED }), 999999)
    ).toThrow(/maintenance/i);
  });
});

describe('Trip state machine transitions', () => {
  it('allows dispatch only from PENDING', () => {
    expect(() => assertTransitionAllowed('dispatch', TripStatus.PENDING)).not.toThrow();
    expect(() => assertTransitionAllowed('dispatch', TripStatus.COMPLETED)).toThrow(/Cannot dispatch/i);
  });

  it('allows complete from DISPATCHED or IN_PROGRESS but not PENDING', () => {
    expect(() => assertTransitionAllowed('complete', TripStatus.IN_PROGRESS)).not.toThrow();
    expect(() => assertTransitionAllowed('complete', TripStatus.DISPATCHED)).not.toThrow();
    expect(() => assertTransitionAllowed('complete', TripStatus.PENDING)).toThrow(/Cannot complete/i);
  });

  it('does not allow cancelling an already completed trip', () => {
    expect(() => assertTransitionAllowed('cancel', TripStatus.COMPLETED)).toThrow(/Cannot cancel/i);
  });
});

describe('Resource release on cancel', () => {
  it('releases resources when trip was DISPATCHED or IN_PROGRESS', () => {
    expect(tripHoldsResources(TripStatus.DISPATCHED)).toBe(true);
    expect(tripHoldsResources(TripStatus.IN_PROGRESS)).toBe(true);
  });

  it('does not release resources for a PENDING trip', () => {
    expect(tripHoldsResources(TripStatus.PENDING)).toBe(false);
  });
});
