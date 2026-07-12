import { Router } from 'express';
import { Role } from '@prisma/client';
import { analyticsController } from './analytics.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { idParamSchema } from '../../utils/commonSchemas';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Analytics are read-only insights for management + finance.
const view = authorize(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST, Role.DISPATCHER, Role.SAFETY_OFFICER);

router.use(authenticate);

router.get('/dashboard', view, asyncHandler(analyticsController.dashboard));
router.get('/fleet-utilization', view, asyncHandler(analyticsController.fleetUtilization));
router.get('/costs', authorize(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST), asyncHandler(analyticsController.costs));
router.get('/drivers', view, asyncHandler(analyticsController.drivers));
router.get(
  '/vehicle/:id/roi',
  authorize(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST),
  validate(idParamSchema),
  asyncHandler(analyticsController.vehicleRoi)
);

export default router;
