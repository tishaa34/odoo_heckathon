import { Router } from 'express';
import { Role } from '@prisma/client';
import { maintenanceController } from './maintenance.controller';
import {
  closeMaintenanceSchema,
  listMaintenanceSchema,
  openMaintenanceSchema,
} from './maintenance.validator';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { idParamSchema } from '../../utils/commonSchemas';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Safety Officers run the maintenance workflow; Fleet Managers too.
const manage = authorize(Role.FLEET_MANAGER, Role.SAFETY_OFFICER);

router.use(authenticate);

router.get('/', validate(listMaintenanceSchema), asyncHandler(maintenanceController.list));
router.get('/:id', validate(idParamSchema), asyncHandler(maintenanceController.getOne));
router.post('/', manage, validate(openMaintenanceSchema), asyncHandler(maintenanceController.open));
router.patch('/:id/close', manage, validate(closeMaintenanceSchema), asyncHandler(maintenanceController.close));

export default router;
