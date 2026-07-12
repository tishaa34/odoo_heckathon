import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { env } from './env';

// Enables `.openapi()` on Zod schemas across the app.
extendZodWithOpenApi(z);

/** Shared registry — modules register their paths/schemas into this. */
export const registry = new OpenAPIRegistry();

// Register the bearer auth scheme once.
export const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

/** Builds the final OpenAPI document after all modules have registered. */
export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'TransitOps API',
      version: '1.0.0',
      description:
        'Smart Transport Operations Platform — fleet, driver, trip dispatch, maintenance, ' +
        'fuel, expense and analytics APIs. The backend is the single source of truth; all ' +
        'business rules and state transitions are enforced server-side.',
    },
    servers: [{ url: env.API_PREFIX }],
  });
}
