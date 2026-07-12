import { ExpenseCategory, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { recordAudit } from '../../utils/audit';
import { AUDIT_ACTIONS } from '../../constants';
import { buildOrderBy, buildPaginationMeta, PaginationParams } from '../../utils/pagination';

const SORTABLE = ['amount', 'category', 'incurredAt', 'createdAt'];

interface CreateExpenseInput {
  vehicleId?: string;
  tripId?: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  incurredAt?: string;
}

export const expenseService = {
  async create(input: CreateExpenseInput, actorId: string) {
    if (!input.vehicleId && !input.tripId) {
      throw ApiError.badRequest('An expense must be linked to a vehicle or a trip.');
    }
    if (input.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
      if (!vehicle) throw ApiError.notFound('Vehicle not found.');
    }
    if (input.tripId) {
      const trip = await prisma.trip.findUnique({ where: { id: input.tripId } });
      if (!trip) throw ApiError.notFound('Trip not found.');
    }

    const expense = await prisma.expense.create({
      data: {
        vehicleId: input.vehicleId,
        tripId: input.tripId,
        category: input.category,
        amount: new Prisma.Decimal(input.amount),
        note: input.note,
        incurredAt: input.incurredAt ? new Date(input.incurredAt) : new Date(),
      },
    });
    await recordAudit({ userId: actorId, action: AUDIT_ACTIONS.CREATE, entity: 'Expense', entityId: expense.id });
    return expense;
  },

  async list(params: PaginationParams & { vehicleId?: string; tripId?: string; category?: ExpenseCategory }) {
    const where: Prisma.ExpenseWhereInput = {};
    if (params.vehicleId) where.vehicleId = params.vehicleId;
    if (params.tripId) where.tripId = params.tripId;
    if (params.category) where.category = params.category;
    const orderBy = buildOrderBy(params.sort, params.order, SORTABLE, 'incurredAt');
    const [items, total] = await Promise.all([
      prisma.expense.findMany({ where, orderBy, skip: params.skip, take: params.take }),
      prisma.expense.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(params.page, params.limit, total) };
  },
};
