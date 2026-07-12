import { MaintenanceStatus, Prisma, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { recordAudit } from '../../utils/audit';
import { AUDIT_ACTIONS } from '../../constants';
import { buildOrderBy, buildPaginationMeta, PaginationParams } from '../../utils/pagination';

const SORTABLE = ['type', 'status', 'cost', 'openedAt', 'closedAt', 'createdAt'];

interface OpenMaintenanceInput {
  vehicleId: string;
  type: string;
  description?: string;
  cost?: number;
}

export const maintenanceService = {
  /**
   * Opening maintenance moves the vehicle AVAILABLE → IN_SHOP atomically, so it
   * immediately drops out of dispatch. Blocked while the vehicle is on a trip.
   */
  async open(input: OpenMaintenanceInput, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: input.vehicleId } });
      if (!vehicle) throw ApiError.notFound('Vehicle not found.');
      if (vehicle.status === VehicleStatus.RETIRED) {
        throw ApiError.businessRule('Cannot open maintenance on a retired vehicle.');
      }
      if (vehicle.status === VehicleStatus.ON_TRIP) {
        throw ApiError.businessRule('Cannot open maintenance while the vehicle is on a trip.');
      }
      if (vehicle.status === VehicleStatus.IN_SHOP) {
        throw ApiError.businessRule('Vehicle already has an open maintenance record.');
      }

      const log = await tx.maintenanceLog.create({
        data: {
          vehicleId: input.vehicleId,
          type: input.type,
          description: input.description,
          cost: input.cost != null ? new Prisma.Decimal(input.cost) : new Prisma.Decimal(0),
          status: MaintenanceStatus.OPEN,
        },
      });
      await tx.vehicle.update({ where: { id: input.vehicleId }, data: { status: VehicleStatus.IN_SHOP } });
      await recordAudit(
        { userId: actorId, action: AUDIT_ACTIONS.MAINTENANCE_OPEN, entity: 'MaintenanceLog', entityId: log.id },
        tx
      );
      return log;
    });
  },

  /** Closing maintenance restores the vehicle IN_SHOP → AVAILABLE. */
  async close(id: string, actorId: string, finalCost?: number) {
    return prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findUnique({ where: { id } });
      if (!log) throw ApiError.notFound('Maintenance record not found.');
      if (log.status === MaintenanceStatus.CLOSED) {
        throw ApiError.businessRule('Maintenance record is already closed.');
      }

      const updated = await tx.maintenanceLog.update({
        where: { id },
        data: {
          status: MaintenanceStatus.CLOSED,
          closedAt: new Date(),
          cost: finalCost != null ? new Prisma.Decimal(finalCost) : undefined,
        },
      });
      // Only restore availability if the vehicle isn't retired in the meantime.
      const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
      if (vehicle && vehicle.status === VehicleStatus.IN_SHOP) {
        await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: VehicleStatus.AVAILABLE } });
      }
      await recordAudit(
        { userId: actorId, action: AUDIT_ACTIONS.MAINTENANCE_CLOSE, entity: 'MaintenanceLog', entityId: id },
        tx
      );
      return updated;
    });
  },

  async getById(id: string) {
    const log = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: { vehicle: { select: { id: true, registrationNumber: true, status: true } } },
    });
    if (!log) throw ApiError.notFound('Maintenance record not found.');
    return log;
  },

  async list(params: PaginationParams & { status?: MaintenanceStatus; vehicleId?: string }) {
    const where: Prisma.MaintenanceLogWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.vehicleId) where.vehicleId = params.vehicleId;
    const orderBy = buildOrderBy(params.sort, params.order, SORTABLE, 'openedAt');
    const [items, total] = await Promise.all([
      prisma.maintenanceLog.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.take,
        include: { vehicle: { select: { id: true, registrationNumber: true } } },
      }),
      prisma.maintenanceLog.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(params.page, params.limit, total) };
  },
};
