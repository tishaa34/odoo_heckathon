import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiDocument } from './openapi';
import { registerDocs } from '../docs/registerDocs';
import { logger } from './logger';

/** Registers all path definitions then mounts Swagger UI at {prefix}/docs. */
export function setupSwagger(app: Express, prefix: string): void {
  registerDocs();
  const document = buildOpenApiDocument();

  app.get(`${prefix}/docs.json`, (_req, res) => res.json(document));
  app.use(`${prefix}/docs`, swaggerUi.serve, swaggerUi.setup(document, {
    customSiteTitle: 'TransitOps API Docs',
    swaggerOptions: { persistAuthorization: true },
  }));

  logger.info(`📚 Swagger docs available at ${prefix}/docs`);
}
