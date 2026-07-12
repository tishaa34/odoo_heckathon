import { Router } from 'express';
import { Role } from '@prisma/client';
import { tripController } from './trip.controller';
import { cancelTripSchema, createTripSchema, listTripSchema } from './trip.validator';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { idParamSchema } from '../../utils/commonSchemas';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Drivers create & drive the trip workflow; Fleet Managers can too.
const manage = authorize(Role.FLEET_MANAGER, Role.DRIVER);

router.use(authenticate);

router.get('/', validate(listTripSchema), asyncHandler(tripController.list));
router.get('/:id', validate(idParamSchema), asyncHandler(tripController.getOne));
router.get('/:id/history', validate(idParamSchema), asyncHandler(tripController.history));

router.post('/', manage, validate(createTripSchema), asyncHandler(tripController.create));
router.post('/:id/start', manage, validate(idParamSchema), asyncHandler(tripController.start));
router.post('/:id/complete', manage, validate(idParamSchema), asyncHandler(tripController.complete));
router.post('/:id/cancel', manage, validate(cancelTripSchema), asyncHandler(tripController.cancel));

export default router;
