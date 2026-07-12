import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/ApiResponse';

export const analyticsController = {
  async dashboard(_req: Request, res: Response) {
    const data = await analyticsService.dashboard();
    return sendSuccess(res, data, 'Dashboard metrics computed successfully.');
  },
  async fleetUtilization(_req: Request, res: Response) {
    const data = await analyticsService.fleetUtilization();
    return sendSuccess(res, data, 'Fleet utilization computed successfully.');
  },
  async vehicleRoi(req: Request, res: Response) {
    const data = await analyticsService.vehicleRoi(req.params.id);
    return sendSuccess(res, data, 'Vehicle ROI computed successfully.');
  },
  async costs(_req: Request, res: Response) {
    const data = await analyticsService.costs();
    return sendSuccess(res, data, 'Cost summary computed successfully.');
  },
  async drivers(_req: Request, res: Response) {
    const data = await analyticsService.drivers();
    return sendSuccess(res, data, 'Driver analytics computed successfully.');
  },
};
