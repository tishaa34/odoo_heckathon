import { Router } from 'express';
import { Role } from '@prisma/client';
import { authController } from './auth.controller';
import { loginSchema, refreshSchema, registerSchema } from './auth.validator';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { authLimiter } from '../../middlewares/rateLimiter';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// New accounts are provisioned by a Fleet Manager only.
router.post(
  '/register',
  authenticate,
  authorize(Role.FLEET_MANAGER),
  validate(registerSchema),
  asyncHandler(authController.register)
);

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', authLimiter, validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/logout', validate(refreshSchema), asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
