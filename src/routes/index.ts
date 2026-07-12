import { Router, Request, Response } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import vehicleRoutes from '../modules/vehicle/vehicle.routes';
import driverRoutes from '../modules/driver/driver.routes';
import tripRoutes from '../modules/trip/trip.routes';
import maintenanceRoutes from '../modules/maintenance/maintenance.routes';
import fuelRoutes from '../modules/fuel/fuel.routes';
import expenseRoutes from '../modules/expense/expense.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';

const router = Router();

/** Liveness/readiness probe (used by Docker healthcheck & load balancers). */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'TransitOps API is healthy.', data: { status: 'ok', uptime: process.uptime() } });
});

router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/trips', tripRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/fuel', fuelRoutes);
router.use('/expenses', expenseRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
