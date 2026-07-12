import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './config/logger';
import { requestId } from './middlewares/requestId';
import { globalLimiter } from './middlewares/rateLimiter';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { setupSwagger } from './config/swagger';
import apiRoutes from './routes';

export function createApp(): Express {
  const app = express();

  // Security & infra middleware (order matters).
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins as string | string[],
      credentials: true,
    })
  );
  app.use(requestId);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // HTTP request logging piped into Winston, tagged with the request id.
  morgan.token('id', (req: Request) => req.requestId ?? '-');
  app.use(
    morgan(':id :method :url :status :response-time ms', {
      stream: { write: (msg) => logger.http?.(msg.trim()) ?? logger.info(msg.trim()) },
      skip: () => env.isTest,
    })
  );

  // Rate limiting for all API traffic.
  app.use(env.API_PREFIX, globalLimiter);

  // API docs.
  setupSwagger(app, env.API_PREFIX);

  // Routes.
  app.get('/', (_req: Request, res: Response) =>
    res.json({ success: true, message: 'TransitOps API', data: { docs: `${env.API_PREFIX}/docs` } })
  );
  app.use(env.API_PREFIX, apiRoutes);

  // 404 + centralized error handling (must be last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
