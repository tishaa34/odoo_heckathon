import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { recordAudit } from '../../utils/audit';
import { AUDIT_ACTIONS } from '../../constants';
import { buildOrderBy, buildPaginationMeta, PaginationParams } from '../../utils/pagination';

const SORTABLE = ['liters', 'cost', 'filledAt', 'createdAt'];

interface CreateFuelInput {
  vehicleId: string;
  tripId?: string;
  liters: number;
  cost: number;
  odometerKm?: number;
  filledAt?: string;
}

export const fuelService = {
  async create(input: CreateFuelInput, actorId: string) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw ApiError.notFound('Vehicle not found.');
    if (input.tripId) {
      const trip = await prisma.trip.findUnique({ where: { id: input.tripId } });
      if (!trip) throw ApiError.notFound('Trip not found.');
    }

    const log = await prisma.fuelLog.create({
      data: {
        vehicleId: input.vehicleId,
        tripId: input.tripId,
        liters: new Prisma.Decimal(input.liters),
        cost: new Prisma.Decimal(input.cost),
        odometerKm: input.odometerKm != null ? new Prisma.Decimal(input.odometerKm) : null,
        filledAt: input.filledAt ? new Date(input.filledAt) : new Date(),
      },
    });
    await recordAudit({ userId: actorId, action: AUDIT_ACTIONS.CREATE, entity: 'FuelLog', entityId: log.id });
    return log;
  },

  async list(params: PaginationParams & { vehicleId?: string; tripId?: string }) {
    const where: Prisma.FuelLogWhereInput = {};
    if (params.vehicleId) where.vehicleId = params.vehicleId;
    if (params.tripId) where.tripId = params.tripId;
    const orderBy = buildOrderBy(params.sort, params.order, SORTABLE, 'filledAt');
    const [items, total] = await Promise.all([
      prisma.fuelLog.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.take,
        include: { vehicle: { select: { id: true, registrationNumber: true } } },
      }),
      prisma.fuelLog.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(params.page, params.limit, total) };
  },
};
