import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse';

export const authController = {
  async register(req: Request, res: Response) {
    const user = await authService.register(req.body, req.user?.id);
    return sendCreated(res, user, 'User registered successfully.');
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body.email, req.body.password);
    return sendSuccess(res, result, 'Login successful.');
  },

  async refresh(req: Request, res: Response) {
    const tokens = await authService.refresh(req.body.refreshToken);
    return sendSuccess(res, tokens, 'Token refreshed successfully.');
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.body.refreshToken);
    return sendSuccess(res, null, 'Logged out successfully.');
  },

  async me(req: Request, res: Response) {
    const user = await authService.me(req.user!.id);
    return sendSuccess(res, user, 'Current user fetched.');
  },
};
