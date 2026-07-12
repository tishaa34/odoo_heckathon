import { Router } from 'express';
import { Role } from '@prisma/client';
import { driverController } from './driver.controller';
import { createDriverSchema, listDriverSchema, updateDriverSchema } from './driver.validator';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { idParamSchema } from '../../utils/commonSchemas';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Safety Officers own driver records (licenses, suspensions); Fleet Managers too.
const manage = authorize(Role.FLEET_MANAGER, Role.SAFETY_OFFICER);

router.use(authenticate);

router.get('/', validate(listDriverSchema), asyncHandler(driverController.list));
router.get('/:id', validate(idParamSchema), asyncHandler(driverController.getOne));
router.post('/', manage, validate(createDriverSchema), asyncHandler(driverController.create));
router.patch('/:id', manage, validate(updateDriverSchema), asyncHandler(driverController.update));
router.delete('/:id', manage, validate(idParamSchema), asyncHandler(driverController.remove));

export default router;
