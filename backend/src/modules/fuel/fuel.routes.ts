import { Router } from 'express';
import { Role } from '@prisma/client';
import { fuelController } from './fuel.controller';
import { createFuelSchema, listFuelSchema } from './fuel.validator';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Financial Analysts and Fleet Managers record fuel; Drivers may also log en-route fills.
const manage = authorize(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST, Role.DRIVER);

router.use(authenticate);

router.get('/', validate(listFuelSchema), asyncHandler(fuelController.list));
router.post('/', manage, validate(createFuelSchema), asyncHandler(fuelController.create));

export default router;
