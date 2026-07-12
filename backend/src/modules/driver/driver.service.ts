import { DriverStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { driverRepository } from './driver.repository';
import { ApiError } from '../../utils/ApiError';
import { recordAudit } from '../../utils/audit';
import { AUDIT_ACTIONS } from '../../constants';
import { buildOrderBy, buildPaginationMeta, PaginationParams } from '../../utils/pagination';

const SORTABLE = ['name', 'email', 'licenseNumber', 'licenseExpiry', 'status', 'createdAt'];

interface CreateDriverInput {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string; // ISO date
}

/** Adds a derived flag so callers see license validity without recomputing. */
function decorate<T extends { licenseExpiry: Date }>(driver: T) {
  return { ...driver, licenseExpired: driver.licenseExpiry.getTime() < Date.now() };
}

export const driverService = {
  async create(input: CreateDriverInput, actorId: string) {
    const [licenseDup, emailDup] = await Promise.all([
      driverRepository.findByLicense(input.licenseNumber),
      driverRepository.findByEmail(input.email),
    ]);
    if (licenseDup) throw ApiError.conflict('A driver with this license number already exists.');
    if (emailDup) throw ApiError.conflict('A driver with this email already exists.');

    const driver = await driverRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      licenseNumber: input.licenseNumber,
      licenseExpiry: new Date(input.licenseExpiry),
    });
    await recordAudit({ userId: actorId, action: AUDIT_ACTIONS.CREATE, entity: 'Driver', entityId: driver.id });
    return decorate(driver);
  },

  async getById(id: string) {
    const driver = await driverRepository.findById(id);
    if (!driver) throw ApiError.notFound('Driver not found.');
    return decorate(driver);
  },

  async list(params: PaginationParams & { status?: DriverStatus }) {
    const where = driverRepository.buildSearchFilter(params.search, params.status);
    const orderBy = buildOrderBy(params.sort, params.order, SORTABLE);
    const { items, total } = await driverRepository.list({ where, orderBy, skip: params.skip, take: params.take });
    return { items: items.map(decorate), meta: buildPaginationMeta(params.page, params.limit, total) };
  },

  async update(id: string, data: Partial<CreateDriverInput> & { status?: DriverStatus }, actorId: string) {
    const current = await driverRepository.findById(id);
    if (!current) throw ApiError.notFound('Driver not found.');

    if (data.licenseNumber) {
      const dup = await driverRepository.findByLicense(data.licenseNumber);
      if (dup && dup.id !== id) throw ApiError.conflict('Another driver already uses this license number.');
    }
    if (data.email) {
      const dup = await driverRepository.findByEmail(data.email);
      if (dup && dup.id !== id) throw ApiError.conflict('Another driver already uses this email.');
    }
    // Guard: a driver on an active trip cannot be manually forced off duty/suspended.
    if (data.status && current.status === DriverStatus.ON_TRIP && data.status !== DriverStatus.ON_TRIP) {
      throw ApiError.businessRule('Cannot change status of a driver who is currently on a trip.');
    }

    const updateData: Prisma.DriverUpdateInput = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      licenseNumber: data.licenseNumber,
      licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
      status: data.status,
    };
    const driver = await driverRepository.update(id, updateData);
    await recordAudit({ userId: actorId, action: AUDIT_ACTIONS.UPDATE, entity: 'Driver', entityId: id });
    return decorate(driver);
  },

  async remove(id: string, actorId: string) {
    const driver = await driverRepository.findById(id);
    if (!driver) throw ApiError.notFound('Driver not found.');
    if (driver.status === DriverStatus.ON_TRIP) {
      throw ApiError.businessRule('Cannot delete a driver who is currently on a trip.');
    }
    // A suspended driver — or one whose license has expired (auto-suspended) —
    // cannot be removed from the roster.
    const licenseExpired = driver.licenseExpiry.getTime() < Date.now();
    if (driver.status === DriverStatus.SUSPENDED || licenseExpired) {
      throw ApiError.businessRule("Drivers who are involved in past trips or are suspended can't be deleted!");
    }
    // Preserve trip history: block deletion when the driver has any trips (FK).
    const tripCount = await prisma.trip.count({ where: { driverId: id } });
    if (tripCount > 0) {
      throw ApiError.businessRule('Cannot delete drivers with trip history.');
    }
    await driverRepository.delete(id);
    await recordAudit({ userId: actorId, action: AUDIT_ACTIONS.DELETE, entity: 'Driver', entityId: id });
  },
};
