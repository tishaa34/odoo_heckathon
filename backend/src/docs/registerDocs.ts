import { z } from 'zod';
import { registry } from '../config/openapi';
import { registerSchema as registerAuthSchema, loginSchema, refreshSchema } from '../modules/auth/auth.validator';
import { createVehicleSchema, updateVehicleSchema } from '../modules/vehicle/vehicle.validator';
import { createDriverSchema, updateDriverSchema } from '../modules/driver/driver.validator';
import { createTripSchema, cancelTripSchema } from '../modules/trip/trip.validator';
import { openMaintenanceSchema, closeMaintenanceSchema } from '../modules/maintenance/maintenance.validator';
import { createFuelSchema } from '../modules/fuel/fuel.validator';
import { createExpenseSchema } from '../modules/expense/expense.validator';

const bearer = [{ bearerAuth: [] as string[] }];

// Generic envelopes for documentation.
const successEnvelope = (data: z.ZodTypeAny) =>
  z.object({ success: z.literal(true), message: z.string(), data });
const errorEnvelope = z.object({
  success: z.literal(false),
  message: z.string(),
  code: z.string(),
  errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
});
const paginated = (item: z.ZodTypeAny) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: z.array(item),
    meta: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  });

const idParam = z.object({ id: z.string().uuid() });
const genericObject = z.record(z.any());

/** Standard error responses attached to every documented route. */
const commonErrors = {
  400: { description: 'Bad request', content: { 'application/json': { schema: errorEnvelope } } },
  401: { description: 'Unauthenticated', content: { 'application/json': { schema: errorEnvelope } } },
  403: { description: 'Forbidden (RBAC)', content: { 'application/json': { schema: errorEnvelope } } },
  404: { description: 'Not found', content: { 'application/json': { schema: errorEnvelope } } },
  422: { description: 'Validation / business-rule violation', content: { 'application/json': { schema: errorEnvelope } } },
};

const json = (schema: z.ZodTypeAny) => ({ content: { 'application/json': { schema } } });
const ok = (schema: z.ZodTypeAny, description = 'Success') => ({
  description,
  content: { 'application/json': { schema } },
});

/**
 * Registers all API paths into the shared OpenAPI registry.
 * Reuses the exact Zod validators the runtime uses — docs can never drift.
 */
export function registerDocs(): void {
  // ── Auth ──────────────────────────────────────────────
  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags: ['Auth'],
    summary: 'Authenticate and receive access + refresh tokens',
    request: { body: json(loginSchema.shape.body) },
    responses: { 200: ok(successEnvelope(genericObject), 'Login successful'), ...commonErrors },
  });
  registry.registerPath({
    method: 'post',
    path: '/auth/refresh',
    tags: ['Auth'],
    summary: 'Rotate a refresh token for a new token pair',
    request: { body: json(refreshSchema.shape.body) },
    responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'post',
    path: '/auth/logout',
    tags: ['Auth'],
    summary: 'Revoke a refresh token',
    request: { body: json(refreshSchema.shape.body) },
    responses: { 200: ok(successEnvelope(z.null())), ...commonErrors },
  });
  registry.registerPath({
    method: 'post',
    path: '/auth/register',
    tags: ['Auth'],
    summary: 'Provision a new user (Fleet Manager only)',
    security: bearer,
    request: { body: json(registerAuthSchema.shape.body) },
    responses: { 201: ok(successEnvelope(genericObject), 'User created'), ...commonErrors },
  });
  registry.registerPath({
    method: 'get',
    path: '/auth/me',
    tags: ['Auth'],
    summary: 'Get the currently authenticated user',
    security: bearer,
    responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
  });

  // ── Vehicles ──────────────────────────────────────────
  registry.registerPath({
    method: 'get',
    path: '/vehicles',
    tags: ['Vehicles'],
    summary: 'List vehicles (pagination, search, status filter)',
    security: bearer,
    responses: { 200: ok(paginated(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'post',
    path: '/vehicles',
    tags: ['Vehicles'],
    summary: 'Create a vehicle (Fleet Manager)',
    security: bearer,
    request: { body: json(createVehicleSchema.shape.body) },
    responses: { 201: ok(successEnvelope(genericObject), 'Vehicle created'), ...commonErrors },
  });
  registry.registerPath({
    method: 'get',
    path: '/vehicles/{id}',
    tags: ['Vehicles'],
    summary: 'Get a vehicle by id',
    security: bearer,
    request: { params: idParam },
    responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'patch',
    path: '/vehicles/{id}',
    tags: ['Vehicles'],
    summary: 'Update a vehicle (Fleet Manager)',
    security: bearer,
    request: { params: idParam, body: json(updateVehicleSchema.shape.body) },
    responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'post',
    path: '/vehicles/{id}/retire',
    tags: ['Vehicles'],
    summary: 'Retire a vehicle (Fleet Manager)',
    security: bearer,
    request: { params: idParam },
    responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'delete',
    path: '/vehicles/{id}',
    tags: ['Vehicles'],
    summary: 'Delete a vehicle (Fleet Manager)',
    security: bearer,
    request: { params: idParam },
    responses: { 200: ok(successEnvelope(z.null())), ...commonErrors },
  });

  // ── Drivers ───────────────────────────────────────────
  registry.registerPath({
    method: 'get',
    path: '/drivers',
    tags: ['Drivers'],
    summary: 'List drivers',
    security: bearer,
    responses: { 200: ok(paginated(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'post',
    path: '/drivers',
    tags: ['Drivers'],
    summary: 'Create a driver (Fleet Manager / Safety Officer)',
    security: bearer,
    request: { body: json(createDriverSchema.shape.body) },
    responses: { 201: ok(successEnvelope(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'get',
    path: '/drivers/{id}',
    tags: ['Drivers'],
    summary: 'Get a driver by id',
    security: bearer,
    request: { params: idParam },
    responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'patch',
    path: '/drivers/{id}',
    tags: ['Drivers'],
    summary: 'Update a driver / change status (suspend, off-duty)',
    security: bearer,
    request: { params: idParam, body: json(updateDriverSchema.shape.body) },
    responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'delete',
    path: '/drivers/{id}',
    tags: ['Drivers'],
    summary: 'Delete a driver',
    security: bearer,
    request: { params: idParam },
    responses: { 200: ok(successEnvelope(z.null())), ...commonErrors },
  });

  // ── Trips ─────────────────────────────────────────────
  registry.registerPath({
    method: 'get',
    path: '/trips',
    tags: ['Trips'],
    summary: 'List trips (status/vehicle/driver filters)',
    security: bearer,
    responses: { 200: ok(paginated(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'post',
    path: '/trips',
    tags: ['Trips'],
    summary: 'Create a PENDING trip (Dispatcher)',
    security: bearer,
    request: { body: json(createTripSchema.shape.body) },
    responses: { 201: ok(successEnvelope(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'get',
    path: '/trips/{id}',
    tags: ['Trips'],
    summary: 'Get a trip by id',
    security: bearer,
    request: { params: idParam },
    responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'get',
    path: '/trips/{id}/history',
    tags: ['Trips'],
    summary: 'Get the status-transition history for a trip',
    security: bearer,
    request: { params: idParam },
    responses: { 200: ok(successEnvelope(z.array(genericObject))), ...commonErrors },
  });
  for (const action of ['dispatch', 'start', 'complete'] as const) {
    registry.registerPath({
      method: 'post',
      path: `/trips/{id}/${action}`,
      tags: ['Trips'],
      summary: `${action[0].toUpperCase()}${action.slice(1)} a trip (enforces all business rules)`,
      security: bearer,
      request: { params: idParam },
      responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
    });
  }
  registry.registerPath({
    method: 'post',
    path: '/trips/{id}/cancel',
    tags: ['Trips'],
    summary: 'Cancel a trip and restore vehicle/driver availability',
    security: bearer,
    request: { params: idParam, body: json(cancelTripSchema.shape.body) },
    responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
  });

  // ── Maintenance ───────────────────────────────────────
  registry.registerPath({
    method: 'get',
    path: '/maintenance',
    tags: ['Maintenance'],
    summary: 'List maintenance records',
    security: bearer,
    responses: { 200: ok(paginated(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'post',
    path: '/maintenance',
    tags: ['Maintenance'],
    summary: 'Open maintenance (moves vehicle to In Shop)',
    security: bearer,
    request: { body: json(openMaintenanceSchema.shape.body) },
    responses: { 201: ok(successEnvelope(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'patch',
    path: '/maintenance/{id}/close',
    tags: ['Maintenance'],
    summary: 'Close maintenance (restores vehicle to Available)',
    security: bearer,
    request: { params: idParam, body: json(closeMaintenanceSchema.shape.body) },
    responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
  });

  // ── Fuel ──────────────────────────────────────────────
  registry.registerPath({
    method: 'get',
    path: '/fuel',
    tags: ['Fuel'],
    summary: 'List fuel logs',
    security: bearer,
    responses: { 200: ok(paginated(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'post',
    path: '/fuel',
    tags: ['Fuel'],
    summary: 'Record a fuel log',
    security: bearer,
    request: { body: json(createFuelSchema.shape.body) },
    responses: { 201: ok(successEnvelope(genericObject)), ...commonErrors },
  });

  // ── Expenses ──────────────────────────────────────────
  registry.registerPath({
    method: 'get',
    path: '/expenses',
    tags: ['Expenses'],
    summary: 'List expenses',
    security: bearer,
    responses: { 200: ok(paginated(genericObject)), ...commonErrors },
  });
  registry.registerPath({
    method: 'post',
    path: '/expenses',
    tags: ['Expenses'],
    summary: 'Record an expense',
    security: bearer,
    request: { body: json(createExpenseSchema.shape.body) },
    responses: { 201: ok(successEnvelope(genericObject)), ...commonErrors },
  });

  // ── Analytics ─────────────────────────────────────────
  for (const [path, summary] of [
    ['/analytics/dashboard', 'Operational dashboard metrics'],
    ['/analytics/fleet-utilization', 'Fleet utilization breakdown'],
    ['/analytics/costs', 'Company-wide cost summary'],
    ['/analytics/drivers', 'Driver utilization & leaderboard'],
  ] as const) {
    registry.registerPath({
      method: 'get',
      path,
      tags: ['Analytics'],
      summary,
      security: bearer,
      responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
    });
  }
  registry.registerPath({
    method: 'get',
    path: '/analytics/vehicle/{id}/roi',
    tags: ['Analytics'],
    summary: 'Vehicle ROI, operating cost and fuel efficiency',
    security: bearer,
    request: { params: idParam },
    responses: { 200: ok(successEnvelope(genericObject)), ...commonErrors },
  });
}
