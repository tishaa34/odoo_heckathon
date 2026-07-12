import { Request, Response } from 'express';
import { ExpenseCategory } from '@prisma/client';
import { expenseService } from './expense.service';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { buildPagination } from '../../utils/pagination';

export const expenseController = {
  async create(req: Request, res: Response) {
    const expense = await expenseService.create(req.body, req.user!.id);
    return sendCreated(res, expense, 'Expense recorded successfully.');
  },

  async list(req: Request, res: Response) {
    const pagination = buildPagination(req.query as Record<string, unknown>);
    const { vehicleId, tripId, category } = req.query as Record<string, string | undefined>;
    const { items, meta } = await expenseService.list({
      ...pagination,
      vehicleId,
      tripId,
      category: category as ExpenseCategory | undefined,
    });
    return sendSuccess(res, items, 'Expenses fetched successfully.', 200, meta);
  },
};
