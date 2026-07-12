import { DriverStatus, Prisma, TripStatus, VehicleStatus } from '@prisma/client';
import { prisma, PrismaTx } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { recordAudit } from '../../utils/audit';
import { AUDIT_ACTIONS } from '../../constants';
import { buildOrderBy, buildPaginationMeta, PaginationParams } from '../../utils/pagination';
import { assertDispatchAllowed, assertTransitionAllowed, tripHoldsResources } from './trip.rules';

const SORTABLE = ['origin', 'destination', 'status', 'scheduledAt', 'createdAt'];
const TRIP_INCLUDE = {
  vehicle: { select: { id: true, registrationNumber: true, make: true, model: true, status: true } },
  driver: { select: { id: true, name: true, licenseNumber: true, status: true } },
} satisfies Prisma.TripInclude;

interface CreateTripInput {
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  cargoWeightKg: number;
  scheduledAt?: string;
  distanceKm?: number;
  revenue?: number;
}

/** Records a status transition in the immutable trip history (within the tx). */
function writeHistory(
  tx: PrismaTx,
  tripId: string,
  from: TripStatus | null,
  to: TripStatus,
  changedById: string,
  reason?: string
) {
  return tx.tripStatusHistory.create({
    data: { tripId, fromStatus: from, toStatus: to, changedById, reason },
  });
}

export const tripService = {
  /**
   * Creates a trip and immediately dispatches it: runs the full rule gate
   * (capacity, vehicle/driver eligibility, license expiry) and, atomically,
   * creates the Trip as DISPATCHED while flipping Vehicle→ON_TRIP and
   * Driver→ON_TRIP. Re-reading vehicle/driver inside the transaction prevents
   * double-assignment races between concurrent trip creations.
   */
  async create(input: CreateTripInput, actorId: string) {
    const trip = await prisma.$transaction(async (tx) => {
      const [vehicle, driver] = await Promise.all([
        tx.vehicle.findUnique({ where: { id: input.vehicleId } }),
        tx.driver.findUnique({ where: { id: input.driverId } }),
      ]);
      if (!vehicle) throw ApiError.notFound('Vehicle not found.');
      if (!driver) throw ApiError.notFound('Driver not found.');
      assertDispatchAllowed(vehicle, driver, input.cargoWeightKg);

      const created = await tx.trip.create({
        data: {
          vehicleId: input.vehicleId,
          driverId: input.driverId,
          origin: input.origin,
          destination: input.destination,
          cargoWeightKg: new Prisma.Decimal(input.cargoWeightKg),
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          distanceKm: input.distanceKm != null ? new Prisma.Decimal(input.distanceKm) : null,
          revenue: input.revenue != null ? new Prisma.Decimal(input.revenue) : new Prisma.Decimal(0),
          createdById: actorId,
          status: TripStatus.DISPATCHED,
        },
        include: TRIP_INCLUDE,
      });

      await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: VehicleStatus.ON_TRIP } });
      await tx.driver.update({ where: { id: driver.id }, data: { status: DriverStatus.ON_TRIP } });

      await writeHistory(tx, created.id, null, TripStatus.DISPATCHED, actorId, 'Trip created & dispatched');
      await recordAudit(
        { userId: actorId, action: AUDIT_ACTIONS.CREATE, entity: 'Trip', entityId: created.id },
        tx
      );
      return created;
    });
    return trip;
  },

  /** START — DISPATCHED → IN_PROGRESS (records departure). */
  async start(tripId: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) throw ApiError.notFound('Trip not found.');
      assertTransitionAllowed('start', trip.status);

      const updated = await tx.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.IN_PROGRESS, startedAt: new Date() },
        include: TRIP_INCLUDE,
      });
      await writeHistory(tx, tripId, trip.status, TripStatus.IN_PROGRESS, actorId, 'Trip started');
      await recordAudit(
        { userId: actorId, action: AUDIT_ACTIONS.START, entity: 'Trip', entityId: tripId },
        tx
      );
      return updated;
    });
  },

  /** COMPLETE — releases vehicle & driver back to AVAILABLE atomically. */
  async complete(tripId: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) throw ApiError.notFound('Trip not found.');
      assertTransitionAllowed('complete', trip.status);

      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.AVAILABLE } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.AVAILABLE } });
      const updated = await tx.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.COMPLETED, completedAt: new Date() },
        include: TRIP_INCLUDE,
      });
      await writeHistory(tx, tripId, trip.status, TripStatus.COMPLETED, actorId, 'Trip completed');
      await recordAudit(
        { userId: actorId, action: AUDIT_ACTIONS.COMPLETE, entity: 'Trip', entityId: tripId },
        tx
      );
      return updated;
    });
  },

  /** CANCEL — restores vehicle & driver availability only if this trip held them. */
  async cancel(tripId: string, actorId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) throw ApiError.notFound('Trip not found.');
      assertTransitionAllowed('cancel', trip.status);

      if (tripHoldsResources(trip.status)) {
        await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.AVAILABLE } });
        await tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.AVAILABLE } });
      }
      const updated = await tx.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.CANCELLED, cancelledAt: new Date() },
        include: TRIP_INCLUDE,
      });
      await writeHistory(tx, tripId, trip.status, TripStatus.CANCELLED, actorId, reason ?? 'Trip cancelled');
      await recordAudit(
        { userId: actorId, action: AUDIT_ACTIONS.CANCEL, entity: 'Trip', entityId: tripId, metadata: { reason } },
        tx
      );
      return updated;
    });
  },

  async getById(id: string) {
    const trip = await prisma.trip.findUnique({ where: { id }, include: TRIP_INCLUDE });
    if (!trip) throw ApiError.notFound('Trip not found.');
    return trip;
  },

  async getHistory(id: string) {
    await this.getById(id);
    return prisma.tripStatusHistory.findMany({ where: { tripId: id }, orderBy: { createdAt: 'asc' } });
  },

  async list(params: PaginationParams & { status?: TripStatus; vehicleId?: string; driverId?: string }) {
    const where: Prisma.TripWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.vehicleId) where.vehicleId = params.vehicleId;
    if (params.driverId) where.driverId = params.driverId;
    if (params.search) {
      where.OR = [
        { origin: { contains: params.search, mode: 'insensitive' } },
        { destination: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    const orderBy = buildOrderBy(params.sort, params.order, SORTABLE);
    const [items, total] = await Promise.all([
      prisma.trip.findMany({ where, orderBy, skip: params.skip, take: params.take, include: TRIP_INCLUDE }),
      prisma.trip.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(params.page, params.limit, total) };
  },
};
