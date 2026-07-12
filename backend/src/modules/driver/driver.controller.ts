import { Request, Response } from 'express';
import { DriverStatus } from '@prisma/client';
import { driverService } from './driver.service';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { buildPagination } from '../../utils/pagination';

export const driverController = {
  async create(req: Request, res: Response) {
    const driver = await driverService.create(req.body, req.user!.id);
    return sendCreated(res, driver, 'Driver created successfully.');
  },

  async list(req: Request, res: Response) {
    const pagination = buildPagination(req.query as Record<string, unknown>);
    const status = req.query.status as DriverStatus | undefined;
    const { items, meta } = await driverService.list({ ...pagination, status });
    return sendSuccess(res, items, 'Drivers fetched successfully.', 200, meta);
  },

  async getOne(req: Request, res: Response) {
    const driver = await driverService.getById(req.params.id);
    return sendSuccess(res, driver, 'Driver fetched successfully.');
  },

  async update(req: Request, res: Response) {
    const driver = await driverService.update(req.params.id, req.body, req.user!.id);
    return sendSuccess(res, driver, 'Driver updated successfully.');
  },

  async remove(req: Request, res: Response) {
    await driverService.remove(req.params.id, req.user!.id);
    return sendSuccess(res, null, 'Driver deleted successfully.');
  },
};
