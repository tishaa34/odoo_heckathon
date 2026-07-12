import { Router } from 'express';
import { Role } from '@prisma/client';
import { vehicleController } from './vehicle.controller';
import { createVehicleSchema, listVehicleSchema, updateVehicleSchema } from './vehicle.validator';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { idParamSchema } from '../../utils/commonSchemas';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Fleet Managers manage the vehicle master data; all authenticated roles can read.
const manage = authorize(Role.FLEET_MANAGER);

router.use(authenticate);

router.get('/', validate(listVehicleSchema), asyncHandler(vehicleController.list));
router.get('/:id', validate(idParamSchema), asyncHandler(vehicleController.getOne));
router.post('/', manage, validate(createVehicleSchema), asyncHandler(vehicleController.create));
router.patch('/:id', manage, validate(updateVehicleSchema), asyncHandler(vehicleController.update));
router.post('/:id/retire', manage, validate(idParamSchema), asyncHandler(vehicleController.retire));
router.delete('/:id', manage, validate(idParamSchema), asyncHandler(vehicleController.remove));

export default router;
