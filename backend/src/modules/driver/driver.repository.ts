import { Prisma, DriverStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

/** Data-access layer for drivers. */
export const driverRepository = {
  create(data: Prisma.DriverCreateInput) {
    return prisma.driver.create({ data });
  },
  findById(id: string) {
    return prisma.driver.findUnique({ where: { id } });
  },
  findByLicense(licenseNumber: string) {
    return prisma.driver.findUnique({ where: { licenseNumber } });
  },
  findByEmail(email: string) {
    return prisma.driver.findUnique({ where: { email } });
  },
  update(id: string, data: Prisma.DriverUpdateInput) {
    return prisma.driver.update({ where: { id }, data });
  },
  delete(id: string) {
    return prisma.driver.delete({ where: { id } });
  },
  async list(params: {
    where: Prisma.DriverWhereInput;
    orderBy: Prisma.DriverOrderByWithRelationInput;
    skip: number;
    take: number;
  }) {
    const [items, total] = await Promise.all([
      prisma.driver.findMany(params),
      prisma.driver.count({ where: params.where }),
    ]);
    return { items, total };
  },
  countByStatus() {
    return prisma.driver.groupBy({ by: ['status'], _count: { _all: true } });
  },
  buildSearchFilter(search: string | undefined, status: DriverStatus | undefined): Prisma.DriverWhereInput {
    const where: Prisma.DriverWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    return where;
  },
};
