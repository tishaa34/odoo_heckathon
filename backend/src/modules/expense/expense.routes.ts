import { Router } from 'express';
import { Role } from '@prisma/client';
import { expenseController } from './expense.controller';
import { createExpenseSchema, listExpenseSchema } from './expense.validator';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

const manage = authorize(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST, Role.DRIVER);

router.use(authenticate);

router.get('/', validate(listExpenseSchema), asyncHandler(expenseController.list));
router.post('/', manage, validate(createExpenseSchema), asyncHandler(expenseController.create));

export default router;
