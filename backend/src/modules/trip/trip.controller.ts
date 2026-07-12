import { Request, Response } from 'express';
import { TripStatus } from '@prisma/client';
import { tripService } from './trip.service';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';
import { buildPagination } from '../../utils/pagination';

export const tripController = {
  async create(req: Request, res: Response) {
    const trip = await tripService.create(req.body, req.user!.id);
    return sendCreated(res, trip, 'Trip created successfully.');
  },

  async list(req: Request, res: Response) {
    const pagination = buildPagination(req.query as Record<string, unknown>);
    const { status, vehicleId, driverId } = req.query as Record<string, string | undefined>;
    const { items, meta } = await tripService.list({
      ...pagination,
      status: status as TripStatus | undefined,
      vehicleId,
      driverId,
    });
    return sendSuccess(res, items, 'Trips fetched successfully.', 200, meta);
  },

  async getOne(req: Request, res: Response) {
    const trip = await tripService.getById(req.params.id);
    return sendSuccess(res, trip, 'Trip fetched successfully.');
  },

  async history(req: Request, res: Response) {
    const history = await tripService.getHistory(req.params.id);
    return sendSuccess(res, history, 'Trip history fetched successfully.');
  },

  async dispatch(req: Request, res: Response) {
    const trip = await tripService.dispatch(req.params.id, req.user!.id);
    return sendSuccess(res, trip, 'Trip dispatched successfully.');
  },

  async start(req: Request, res: Response) {
    const trip = await tripService.start(req.params.id, req.user!.id);
    return sendSuccess(res, trip, 'Trip started successfully.');
  },

  async complete(req: Request, res: Response) {
    const trip = await tripService.complete(req.params.id, req.user!.id);
    return sendSuccess(res, trip, 'Trip completed successfully.');
  },

  async cancel(req: Request, res: Response) {
    const trip = await tripService.cancel(req.params.id, req.user!.id, req.body?.reason);
    return sendSuccess(res, trip, 'Trip cancelled successfully.');
  },
};
