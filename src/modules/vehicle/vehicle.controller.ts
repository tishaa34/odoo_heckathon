import { Request, Response } from 'express';
import { VehicleStatus } from '@prisma/client';
import { vehicleService } from './vehicle.service';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { buildPagination } from '../../utils/pagination';

export const vehicleController = {
  async create(req: Request, res: Response) {
    const vehicle = await vehicleService.create(req.body, req.user!.id);
    return sendCreated(res, vehicle, 'Vehicle created successfully.');
  },

  async list(req: Request, res: Response) {
    const pagination = buildPagination(req.query as Record<string, unknown>);
    const status = req.query.status as VehicleStatus | undefined;
    const { items, meta } = await vehicleService.list({ ...pagination, status });
    return sendSuccess(res, items, 'Vehicles fetched successfully.', 200, meta);
  },

  async getOne(req: Request, res: Response) {
    const vehicle = await vehicleService.getById(req.params.id);
    return sendSuccess(res, vehicle, 'Vehicle fetched successfully.');
  },

  async update(req: Request, res: Response) {
    const vehicle = await vehicleService.update(req.params.id, req.body, req.user!.id);
    return sendSuccess(res, vehicle, 'Vehicle updated successfully.');
  },

  async retire(req: Request, res: Response) {
    const vehicle = await vehicleService.retire(req.params.id, req.user!.id);
    return sendSuccess(res, vehicle, 'Vehicle retired successfully.');
  },

  async remove(req: Request, res: Response) {
    await vehicleService.remove(req.params.id, req.user!.id);
    return sendSuccess(res, null, 'Vehicle deleted successfully.');
  },
};
