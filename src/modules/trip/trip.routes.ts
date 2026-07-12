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

// Dispatchers drive the trip workflow; Fleet Managers can too.
const dispatch = authorize(Role.FLEET_MANAGER, Role.DISPATCHER);

router.use(authenticate);

router.get('/', validate(listTripSchema), asyncHandler(tripController.list));
router.get('/:id', validate(idParamSchema), asyncHandler(tripController.getOne));
router.get('/:id/history', validate(idParamSchema), asyncHandler(tripController.history));

router.post('/', dispatch, validate(createTripSchema), asyncHandler(tripController.create));
router.post('/:id/dispatch', dispatch, validate(idParamSchema), asyncHandler(tripController.dispatch));
router.post('/:id/start', dispatch, validate(idParamSchema), asyncHandler(tripController.start));
router.post('/:id/complete', dispatch, validate(idParamSchema), asyncHandler(tripController.complete));
router.post('/:id/cancel', dispatch, validate(cancelTripSchema), asyncHandler(tripController.cancel));

export default router;
