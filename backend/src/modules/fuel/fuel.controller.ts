import { Request, Response } from 'express';
import { fuelService } from './fuel.service';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { buildPagination } from '../../utils/pagination';

export const fuelController = {
  async create(req: Request, res: Response) {
    const log = await fuelService.create(req.body, req.user!.id);
    return sendCreated(res, log, 'Fuel log recorded successfully.');
  },

  async list(req: Request, res: Response) {
    const pagination = buildPagination(req.query as Record<string, unknown>);
    const { vehicleId, tripId } = req.query as Record<string, string | undefined>;
    const { items, meta } = await fuelService.list({ ...pagination, vehicleId, tripId });
    return sendSuccess(res, items, 'Fuel logs fetched successfully.', 200, meta);
  },
};
