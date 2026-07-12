import { Request, Response } from 'express';
import { MaintenanceStatus } from '@prisma/client';
import { maintenanceService } from './maintenance.service';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { buildPagination } from '../../utils/pagination';

export const maintenanceController = {
  async open(req: Request, res: Response) {
    const log = await maintenanceService.open(req.body, req.user!.id);
    return sendCreated(res, log, 'Maintenance opened. Vehicle moved to In Shop.');
  },

  async close(req: Request, res: Response) {
    const log = await maintenanceService.close(req.params.id, req.user!.id, req.body?.cost);
    return sendSuccess(res, log, 'Maintenance closed. Vehicle restored to Available.');
  },

  async getOne(req: Request, res: Response) {
    const log = await maintenanceService.getById(req.params.id);
    return sendSuccess(res, log, 'Maintenance record fetched successfully.');
  },

  async list(req: Request, res: Response) {
    const pagination = buildPagination(req.query as Record<string, unknown>);
    const { status, vehicleId } = req.query as Record<string, string | undefined>;
    const { items, meta } = await maintenanceService.list({
      ...pagination,
      status: status as MaintenanceStatus | undefined,
      vehicleId,
    });
    return sendSuccess(res, items, 'Maintenance records fetched successfully.', 200, meta);
  },
};
