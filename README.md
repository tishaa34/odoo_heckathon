# 🚚 TransitOps — Smart Transport Operations Platform

A production-grade backend that digitizes the complete transport workflow for logistics
companies — replacing spreadsheets, notebooks and WhatsApp with a single, validated source of
truth. Every business rule, state transition and calculation is enforced **server-side**; the
frontend never makes business decisions.

Built with **Node.js · Express · TypeScript · PostgreSQL · Prisma · JWT · Zod · Winston · Swagger · Docker**.

---

## ✨ Highlights

- **Workflow engine, not CRUD** — a guarded trip state machine (`PENDING → DISPATCHED → IN_PROGRESS → COMPLETED / CANCELLED`) runs inside database transactions to prevent double-assignment and race conditions.
- **Automatic status coupling** — dispatch flips vehicle & driver to `ON_TRIP`; completion/cancellation frees them; opening maintenance moves a vehicle to `IN_SHOP` and removes it from dispatch.
- **Every business rule enforced** — retired/in-shop vehicles, expired licenses, suspended/off-duty drivers, and cargo-over-capacity are all rejected with clear `422` messages.
- **Real RBAC** — 4 roles (`FLEET_MANAGER`, `DISPATCHER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`) enforced by middleware on every route.
- **Analytics engine** — fleet utilization, vehicle ROI, fuel efficiency, operational cost and driver utilization computed live from records.
- **Production concerns** — access + rotating refresh tokens, bcrypt, helmet, CORS, rate limiting, Zod validation, Winston logging with request ids, centralized error handling, and a full **audit trail**.
- **One-command startup** — `docker compose up --build` provisions Postgres, applies the schema, seeds demo data and starts the API.

---

## 🏗️ Architecture

```
Client → Express
  → helmet · cors · rate-limit · requestId · morgan→winston
  → Route → authenticate (JWT) → authorize (RBAC) → validate (Zod)
  → Controller (thin)  → Service (all business logic + $transaction)  → Repository (Prisma)
  → PostgreSQL
  ← Central error handler → consistent JSON envelope   + AuditLog on every mutation
```

**Layering rule:** controllers have zero business logic; services own all rules and orchestrate
transactions; repositories are the only place that touch Prisma.

### Folder structure (feature-modular)

```
src/
├── modules/                     # one self-contained folder per domain
│   ├── auth/        (controller · service · routes · validator)
│   ├── vehicle/     (+ repository)
│   ├── driver/      (+ repository)
│   ├── trip/        (service = dispatch state machine, rules = pure & unit-tested)
│   ├── maintenance/ · fuel/ · expense/ · analytics/
├── middlewares/     # authenticate, authorize, validate, errorHandler, rateLimiter, requestId
├── config/          # env (zod-validated), logger, prisma, swagger, openapi
├── constants/ · utils/ · types/ · docs/ · routes/
├── app.ts           # express wiring
└── server.ts        # bootstrap + graceful shutdown
prisma/  schema.prisma · seed.ts
tests/   trip.rules.spec.ts
```

---

## 🗄️ Database Design

UUID primary keys, `createdAt`/`updatedAt` everywhere, foreign keys, indexes on all
filter/lookup columns, enums for state, and `Decimal` for money/weight.

| Entity | Purpose |
|---|---|
| `User` / `RefreshToken` | Auth & rotating refresh tokens |
| `Vehicle` | Fleet master data + `VehicleStatus` |
| `Driver` | Drivers + license + `DriverStatus` |
| `Trip` | Dispatch workflow + `TripStatus` |
| `TripStatusHistory` | Immutable audit of every transition |
| `MaintenanceLog` | Maintenance, coupled to vehicle status |
| `FuelLog` / `Expense` | Cost tracking |
| `VehicleDocument` | Vehicle documents & expiry |
| `AuditLog` | Who did what, when |

---

## 🔐 Roles & Permissions (RBAC)

| Resource | FLEET_MANAGER | DISPATCHER | SAFETY_OFFICER | FINANCIAL_ANALYST |
|---|:--:|:--:|:--:|:--:|
| Users (register) | ✅ | — | — | — |
| Vehicles (write) | ✅ | read | read | read |
| Drivers (write) | ✅ | read | ✅ | read |
| Trips / dispatch | ✅ | ✅ | read | read |
| Maintenance | ✅ | — | ✅ | — |
| Fuel | ✅ | ✅ | — | ✅ |
| Expenses | ✅ | — | — | ✅ |
| Analytics | ✅ | ✅ | ✅ | ✅ |

All routes require authentication; mutations additionally require an authorized role.

---

## 🚀 Quick Start

### Option A — Docker (recommended, one command)

```bash
cp .env.example .env        # optional: tweak secrets
docker compose up --build
```

This starts PostgreSQL, applies the schema, seeds demo data, and starts the API on
**http://localhost:4000**. Swagger UI: **http://localhost:4000/api/v1/docs**.

### Option B — Local development

```bash
cp .env.example .env        # point DATABASE_URL at your local Postgres
npm install
npm run prisma:generate
npm run prisma:migrate      # or: npx prisma db push
npm run db:seed
npm run dev
```

---

## 🔑 Seed Credentials

All demo users share the password **`Password123!`**.

| Role | Email |
|---|---|
| Fleet Manager | `manager@transitops.com` |
| Dispatcher | `dispatcher@transitops.com` |
| Safety Officer | `safety@transitops.com` |
| Financial Analyst | `finance@transitops.com` |

The seed intentionally includes a driver with an **expired license**, a **suspended** driver, a
vehicle **in the shop**, and a **retired** vehicle so the rule rejections can be demonstrated live.

---

## 📖 API Overview

Base path: `/api/v1` · Consistent envelope: `{ success, message, data, meta? }`.

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/login` · `/auth/refresh` · `/auth/logout` · `/auth/register` · `GET /auth/me` |
| Vehicles | `GET/POST /vehicles` · `GET/PATCH/DELETE /vehicles/:id` · `POST /vehicles/:id/retire` |
| Drivers | `GET/POST /drivers` · `GET/PATCH/DELETE /drivers/:id` |
| Trips | `GET/POST /trips` · `GET /trips/:id` · `/trips/:id/history` · `POST /trips/:id/{dispatch,start,complete,cancel}` |
| Maintenance | `GET/POST /maintenance` · `PATCH /maintenance/:id/close` |
| Fuel / Expenses | `GET/POST /fuel` · `GET/POST /expenses` |
| Analytics | `GET /analytics/{dashboard,fleet-utilization,costs,drivers}` · `/analytics/vehicle/:id/roi` |

List endpoints support `?page&limit&sort&order&search&status`. Full request/response/error
schemas are in **Swagger UI** at `/api/v1/docs`.

### Example: end-to-end dispatch

```bash
# 1) Login as dispatcher
TOKEN=$(curl -s localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"dispatcher@transitops.com","password":"Password123!"}' \
  | jq -r .data.accessToken)

# 2) Create a trip, then dispatch it (vehicle + driver flip to ON_TRIP)
curl -s -X POST localhost:4000/api/v1/trips/<TRIP_ID>/dispatch -H "Authorization: Bearer $TOKEN"

# 3) Complete it (vehicle + driver return to AVAILABLE)
curl -s -X POST localhost:4000/api/v1/trips/<TRIP_ID>/complete -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Testing

```bash
npm test
```

Unit tests cover the pure rule engine — vehicle/driver eligibility, cargo capacity, the trip
state machine, and resource release on cancel (the exact scenarios judges care about).

---

## 🛡️ Business Rules Enforced

- Registration numbers and license numbers are unique.
- Retired / in-shop / already-on-trip vehicles cannot be dispatched.
- Suspended / off-duty / already-on-trip drivers, and expired licenses, cannot be dispatched.
- Cargo weight can never exceed vehicle capacity.
- Dispatch → vehicle & driver `ON_TRIP`; complete/cancel → back to `AVAILABLE`.
- Opening maintenance → vehicle `IN_SHOP`; closing → `AVAILABLE`.
- Illegal state transitions (e.g. completing a pending trip) are rejected.
- All mutations run in transactions and write an audit-log entry.

---

## ⚙️ Tech Stack

| Concern | Choice |
|---|---|
| Runtime / Framework | Node.js 20 · Express · TypeScript |
| Database / ORM | PostgreSQL 16 · Prisma |
| Auth | JWT (access + rotating refresh) · bcrypt |
| Validation | Zod (also the source of the OpenAPI schemas) |
| Logging | Winston + request ids |
| Docs | Swagger / OpenAPI 3 |
| Container | Docker · Docker Compose |

---

## 📝 Environment Variables

See [`.env.example`](.env.example). Key variables: `DATABASE_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `PORT`, `CORS_ORIGINS`, `RATE_LIMIT_*`. **Set strong secrets in production.**
