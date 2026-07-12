import { Prisma, VehicleStatus } from '@prisma/client';
import { vehicleRepository } from './vehicle.repository';
import { ApiError } from '../../utils/ApiError';
import { recordAudit } from '../../utils/audit';
import { AUDIT_ACTIONS } from '../../constants';
import { buildOrderBy, buildPaginationMeta, PaginationParams } from '../../utils/pagination';

const SORTABLE = ['registrationNumber', 'make', 'model', 'capacityKg', 'status', 'createdAt'];

interface CreateVehicleInput {
  registrationNumber: string;
  make: string;
  model: string;
  year?: number;
  capacityKg: number;
  odometerKm?: number;
  acquisitionCost?: number;
}

export const vehicleService = {
  async create(input: CreateVehicleInput, actorId: string) {
    const exists = await vehicleRepository.findByRegistration(input.registrationNumber);
    if (exists) throw ApiError.conflict('A vehicle with this registration number already exists.');

    const vehicle = await vehicleRepository.create({
      registrationNumber: input.registrationNumber,
      make: input.make,
      model: input.model,
      year: input.year,
      capacityKg: new Prisma.Decimal(input.capacityKg),
      odometerKm: input.odometerKm != null ? new Prisma.Decimal(input.odometerKm) : new Prisma.Decimal(0),
      acquisitionCost: input.acquisitionCost != null ? new Prisma.Decimal(input.acquisitionCost) : new Prisma.Decimal(0),
    });
    await recordAudit({ userId: actorId, action: AUDIT_ACTIONS.CREATE, entity: 'Vehicle', entityId: vehicle.id });
    return vehicle;
  },

  async getById(id: string) {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) throw ApiError.notFound('Vehicle not found.');
    return vehicle;
  },

  async list(params: PaginationParams & { status?: VehicleStatus }) {
    const where = vehicleRepository.buildSearchFilter(params.search, params.status);
    const orderBy = buildOrderBy(params.sort, params.order, SORTABLE);
    const { items, total } = await vehicleRepository.list({ where, orderBy, skip: params.skip, take: params.take });
    return { items, meta: buildPaginationMeta(params.page, params.limit, total) };
  },

  async update(id: string, data: Partial<CreateVehicleInput>, actorId: string) {
    await this.getById(id);
    if (data.registrationNumber) {
      const dup = await vehicleRepository.findByRegistration(data.registrationNumber);
      if (dup && dup.id !== id) throw ApiError.conflict('Another vehicle already uses this registration number.');
    }
    const updateData: Prisma.VehicleUpdateInput = {
      registrationNumber: data.registrationNumber,
      make: data.make,
      model: data.model,
      year: data.year,
      capacityKg: data.capacityKg != null ? new Prisma.Decimal(data.capacityKg) : undefined,
      odometerKm: data.odometerKm != null ? new Prisma.Decimal(data.odometerKm) : undefined,
      acquisitionCost: data.acquisitionCost != null ? new Prisma.Decimal(data.acquisitionCost) : undefined,
    };
    const vehicle = await vehicleRepository.update(id, updateData);
    await recordAudit({ userId: actorId, action: AUDIT_ACTIONS.UPDATE, entity: 'Vehicle', entityId: id });
    return vehicle;
  },

  /** Retire a vehicle. Blocked while it is on a trip. */
  async retire(id: string, actorId: string) {
    const vehicle = await this.getById(id);
    if (vehicle.status === VehicleStatus.ON_TRIP) {
      throw ApiError.businessRule('Cannot retire a vehicle that is currently on a trip.');
    }
    if (vehicle.status === VehicleStatus.IN_SHOP) {
      throw ApiError.businessRule('Cannot retire a vehicle that is under maintenance. Close maintenance first.');
    }
    const updated = await vehicleRepository.update(id, { status: VehicleStatus.RETIRED, isRetired: true });
    await recordAudit({ userId: actorId, action: AUDIT_ACTIONS.RETIRE, entity: 'Vehicle', entityId: id });
    return updated;
  },

  async remove(id: string, actorId: string) {
    const vehicle = await this.getById(id);
    if (vehicle.status === VehicleStatus.ON_TRIP) {
      throw ApiError.businessRule('Cannot delete a vehicle that is currently on a trip.');
    }
    await vehicleRepository.delete(id);
    await recordAudit({ userId: actorId, action: AUDIT_ACTIONS.DELETE, entity: 'Vehicle', entityId: id });
  },
};
