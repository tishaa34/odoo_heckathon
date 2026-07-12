import { Prisma, VehicleStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

/** Data-access layer for vehicles. Only place that touches prisma.vehicle. */
export const vehicleRepository = {
  create(data: Prisma.VehicleCreateInput) {
    return prisma.vehicle.create({ data });
  },

  findById(id: string) {
    return prisma.vehicle.findUnique({ where: { id } });
  },

  findByRegistration(registrationNumber: string) {
    return prisma.vehicle.findUnique({ where: { registrationNumber } });
  },

  update(id: string, data: Prisma.VehicleUpdateInput) {
    return prisma.vehicle.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.vehicle.delete({ where: { id } });
  },

  async list(params: {
    where: Prisma.VehicleWhereInput;
    orderBy: Prisma.VehicleOrderByWithRelationInput;
    skip: number;
    take: number;
  }) {
    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({
        where: params.where,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.take,
      }),
      prisma.vehicle.count({ where: params.where }),
    ]);
    return { items, total };
  },

  countByStatus() {
    return prisma.vehicle.groupBy({ by: ['status'], _count: { _all: true } });
  },

  buildSearchFilter(search: string | undefined, status: VehicleStatus | undefined): Prisma.VehicleWhereInput {
    const where: Prisma.VehicleWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }
    return where;
  },
};
