# 🚚 TransitOps — Smart Transport Operations Platform

A production-grade **full-stack** platform that digitizes the complete transport workflow for
logistics companies — replacing spreadsheets, notebooks and WhatsApp with a single, role-aware
operations dashboard for managing **fleet, drivers, trips, maintenance, fuel, expenses and
analytics**. Every business rule, state transition and calculation is enforced **server-side**;
the frontend never makes business decisions.

Built with **Node.js · Express · TypeScript · PostgreSQL · Prisma · JWT · Zod · Winston · Swagger
· Docker** on the backend, and **React 18 · TypeScript · Vite · Tailwind CSS · TanStack Query ·
React Hook Form + Zod · Recharts** on the frontend.

This repo contains two apps:

| App | Path | Docs |
|---|---|---|
| Backend API | [`backend/`](backend) | Architecture, DB design, business rules — see below |
| Frontend web client | [`frontend/`](frontend) | Design system, RBAC matrix, architecture — see below |

---

## ✨ Highlights

- **Workflow engine, not CRUD** — a guarded trip state machine (`DISPATCHED → IN_PROGRESS → COMPLETED / CANCELLED`) runs inside database transactions to prevent double-assignment and race conditions. Creating a trip runs the full eligibility gate and dispatches it in the same atomic step — there is no separate manual "dispatch" action.
- **Automatic status coupling** — creating a trip immediately flips vehicle & driver to `ON_TRIP`; completion/cancellation frees them; opening maintenance moves a vehicle to `IN_SHOP` and removes it from the trip-creation pool.
- **Every business rule enforced** — retired/in-shop vehicles, expired licenses, suspended/off-duty drivers, and cargo-over-capacity are all rejected with clear `422` messages.
- **Real RBAC end to end** — 4 roles (`FLEET_MANAGER`, `DRIVER`/`DISPATCHER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST`) enforced by backend middleware on every route, and mirrored in the frontend nav/route guards.
- **Analytics engine** — fleet utilization, vehicle ROI, fuel efficiency, operational cost and driver utilization computed live from records, visualized with KPI cards and charts.
- **Full trip lifecycle UI** — Draft → Dispatched → In Progress → Completed / Cancelled, with live capacity validation and backend business-rule errors surfaced inline.
- **Production concerns** — access + rotating refresh tokens, bcrypt, helmet, CORS, rate limiting, Zod validation, Winston logging with request ids, centralized error handling, and a full **audit trail**.
- **Design system** — reusable Button, Input, Select, Modal, Table, Badge, Pagination, KPI Card, Chart wrappers, Skeletons, Empty/Error states and Toasts. Light & dark themes, fully responsive.
- **One-command startup** — `docker compose up --build` provisions Postgres, applies the schema, seeds demo data and starts both the API and the web app.

---

## 🚀 Quick start (Docker — the whole stack)

From the **repository root** (this builds Postgres + API + Web together):

```bash
docker compose up --build
```

Then open:

| Service   | URL                                   |
| --------- | -------------------------------------- |
| Web app   | http://localhost:8080                 |
| API       | http://localhost:4000/api/v1          |
| API docs  | http://localhost:4000/api/v1/docs     |

The database is auto-migrated and **seeded** on first boot. Nginx proxies `/api` from the web
container to the API container, so there is **no CORS setup and nothing to configure** — just
open the browser.

### Demo accounts

All demo users share the password **`Password123!`**:

| Role              | Email                       |
| ----------------- | --------------------------- |
| Fleet Manager     | `manager@transitops.com`    |
| Dispatcher/Driver | `driver@transitops.com`     |
| Safety Officer    | `safety@transitops.com`     |
| Financial Analyst | `finance@transitops.com`    |

The login screen has **one-click demo fill** buttons for each role. The seed intentionally
includes a driver with an **expired license**, a **suspended** driver, a vehicle **in the shop**,
and a **retired** vehicle so the rule rejections can be demonstrated live.

---

## 🧑‍💻 Local development

Run backend and frontend separately (each needs its own terminal).

### Backend

Requires **Node 20+** and a local PostgreSQL instance.

```bash
cd backend
cp .env.example .env        # point DATABASE_URL at your local Postgres
npm install
npm run prisma:generate
npm run prisma:migrate      # or: npx prisma db push
npm run db:seed
npm run dev                 # http://localhost:4000
```

### Frontend

Requires **Node 20+**.

```bash
cd frontend
cp .env.example .env        # optional — sensible defaults are baked in
npm install
npm run dev                 # http://localhost:5173
```

The Vite dev server proxies `/api` → `VITE_PROXY_TARGET` (default `http://localhost:4000`), so
the browser stays same-origin.

---

## 🏗️ Architecture

```
Client (React SPA) → Express API
  → helmet · cors · rate-limit · requestId · morgan→winston
  → Route → authenticate (JWT) → authorize (RBAC) → validate (Zod)
  → Controller (thin)  → Service (all business logic + $transaction)  → Repository (Prisma)
  → PostgreSQL
  ← Central error handler → consistent JSON envelope   + AuditLog on every mutation
```

**Layering rule:** controllers have zero business logic; services own all rules and orchestrate
transactions; repositories are the only place that touch Prisma. On the frontend, UI components
never call `axios` directly — data access lives in `services/api`, orchestration in `hooks/*`,
and pages compose the two.

### Backend folder structure (feature-modular)

```
backend/
├── src/
├── modules/                     # one self-contained folder per domain
│   ├── auth/        (controller · service · routes · validator)
│   ├── vehicle/     (+ repository)
│   ├── driver/      (+ repository)
│   ├── trip/        (service = create-and-dispatch state machine, rules = pure & unit-tested)
│   ├── maintenance/ · fuel/ · expense/ · analytics/
├── middlewares/     # authenticate, authorize, validate, errorHandler, rateLimiter, requestId
├── config/          # env (zod-validated), logger, prisma, swagger, openapi
├── constants/ · utils/ · types/ · docs/ · routes/
├── app.ts           # express wiring
└── server.ts        # bootstrap + graceful shutdown
prisma/  schema.prisma · seed.ts
tests/   trip.rules.spec.ts
```

### Frontend folder structure

```
frontend/src
├── assets/                 static assets
├── components/
│   ├── common/             design-system primitives (Button, Field, Modal, Badge, Card, Pagination, Feedback, RoleGate…)
│   ├── layout/             AppLayout, Sidebar, Navbar
│   ├── tables/             generic DataTable (sorting, loading, empty)
│   ├── cards/              KpiCard
│   └── charts/             Recharts wrappers (Bar/Line/Pie + ChartCard)
├── contexts/               AuthContext, ThemeContext
├── hooks/                  TanStack Query hooks per domain + useListControls
├── pages/                  feature screens (Auth, Dashboard, Vehicles, Drivers, Trips, Maintenance, Fuel, Analytics, Settings)
├── routes/                 AppRouter + ProtectedRoute (RBAC gate)
├── services/               axios client (token refresh, error normalization), typed API, query client
├── constants/              RBAC config, status/color metadata, nav
├── types/                  shared domain + API types
├── utils/                  formatting, csv export, cn
└── styles/                 Tailwind + design tokens (CSS variables)
```

### Design decisions

- **One envelope, one error shape** — `services/http.ts` normalizes the backend's `{ success, message, code, errors[] }` envelope. Business-rule violations (HTTP 422) are shown as toasts _and_ mapped back onto the offending form fields.
- **RBAC is data-driven** — a single `NAV_ITEMS` / `WRITE_ACCESS` config in `constants/` drives sidebar visibility, route guards and per-row action buttons, mirroring the backend's `authorize()` rules.
- **Query-key discipline** — centralized keys (`services/queryClient.ts`) make cache invalidation after mutations predictable across modules (e.g. dispatching a trip refreshes trips, vehicles, drivers and the dashboard).
- **Theme via CSS variables** — components use the same class names in light and dark; only the token values change.

---

## 🗄️ Database Design

UUID primary keys, `createdAt`/`updatedAt` everywhere, foreign keys, indexes on all
filter/lookup columns, enums for state, and `Decimal` for money/weight.

| Entity | Purpose |
|---|---|
| `User` / `RefreshToken` | Auth & rotating refresh tokens |
| `Vehicle` | Fleet master data + `VehicleStatus` |
| `Driver` | Drivers + license + `DriverStatus` |
| `Trip` | Create-and-dispatch workflow + `TripStatus` |
| `TripStatusHistory` | Immutable audit of every transition |
| `MaintenanceLog` | Maintenance, coupled to vehicle status |
| `FuelLog` / `Expense` | Cost tracking |
| `VehicleDocument` | Vehicle documents & expiry |
| `AuditLog` | Who did what, when |

---

## 🔐 Roles & Permissions (RBAC)

Backend enforcement (per resource):

| Resource | FLEET_MANAGER | DRIVER | SAFETY_OFFICER | FINANCIAL_ANALYST |
|---|:--:|:--:|:--:|:--:|
| Users (register) | ✅ | — | — | — |
| Vehicles (write) | ✅ | read | read | read |
| Drivers (write) | ✅ | read | ✅ | read |
| Trips (create & dispatch) | ✅ | ✅ | read | read |
| Maintenance | ✅ | — | ✅ | — |
| Fuel | ✅ | ✅ | — | ✅ |
| Expenses | ✅ | — | — | ✅ |
| Analytics | ✅ | ✅ | ✅ | ✅ |

All routes require authentication; mutations additionally require an authorized role.

Frontend mirror (per module, UI-level):

| Module      | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
| ----------- | :-----------: | :--------: | :------------: | :---------------: |
| Fleet       |   Full        |   View     |      —         |       View        |
| Drivers     |   Full        |    —       |     Full       |        —          |
| Trips       |   Full        |   Full     |     View       |        —          |
| Maintenance |   Full        |    —       |     Full       |        —          |
| Fuel/Exp.   |   Full        |   Fuel     |      —         |       Full        |
| Analytics   |   Full        |    —       |      —         |       Full        |

---

## 📖 API Overview

Base path: `/api/v1` · Consistent envelope: `{ success, message, data, meta? }`.

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/login` · `/auth/refresh` · `/auth/logout` · `/auth/register` · `GET /auth/me` |
| Vehicles | `GET/POST /vehicles` · `GET/PATCH/DELETE /vehicles/:id` · `POST /vehicles/:id/retire` |
| Drivers | `GET/POST /drivers` · `GET/PATCH/DELETE /drivers/:id` |
| Trips | `GET/POST /trips` (create = dispatch) · `GET /trips/:id` · `/trips/:id/history` · `POST /trips/:id/{start,complete,cancel}` |
| Maintenance | `GET/POST /maintenance` · `PATCH /maintenance/:id/close` |
| Fuel / Expenses | `GET/POST /fuel` · `GET/POST /expenses` |
| Analytics | `GET /analytics/{dashboard,fleet-utilization,costs,drivers}` · `/analytics/vehicle/:id/roi` |

List endpoints support `?page&limit&sort&order&search&status`. Full request/response/error
schemas are in **Swagger UI** at `/api/v1/docs`.

### Example: end-to-end trip

```bash
# 1) Login as a driver
TOKEN=$(curl -s localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"driver@transitops.com","password":"Password123!"}' \
  | jq -r .data.accessToken)

# 2) Create a trip — this validates eligibility and dispatches it in one step
#    (vehicle + driver flip to ON_TRIP immediately, trip is created as DISPATCHED)
curl -s -X POST localhost:4000/api/v1/trips -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"vehicleId":"<VEHICLE_ID>","driverId":"<DRIVER_ID>","origin":"Ahmedabad","destination":"Surat","cargoWeightKg":5000}'

# 3) Complete it (vehicle + driver return to AVAILABLE)
curl -s -X POST localhost:4000/api/v1/trips/<TRIP_ID>/complete -H "Authorization: Bearer $TOKEN"
```

---

## 🛡️ Business Rules Enforced

- Registration numbers and license numbers are unique.
- Retired / in-shop / already-on-trip vehicles cannot be assigned to a trip.
- Suspended / off-duty / already-on-trip drivers, and expired licenses, cannot be assigned to a trip.
- Cargo weight can never exceed vehicle capacity.
- Creating a trip → vehicle & driver `ON_TRIP` immediately; complete/cancel → back to `AVAILABLE`.
- Opening maintenance → vehicle `IN_SHOP`; closing → `AVAILABLE`.
- Illegal state transitions (e.g. completing an already-completed trip) are rejected.
- All mutations run in transactions and write an audit-log entry.

---

## 🧪 Testing

Backend — unit tests cover the pure rule engine (vehicle/driver eligibility, cargo capacity, the
trip state machine, and resource release on cancel):

```bash
cd backend
npm test
```

Frontend — Vitest + Testing Library cover formatting utilities, status-badge mapping and the
login form (validation + demo fill):

```bash
cd frontend
npm run test
```

---

## 🐳 Docker (single service only)

Backend:

```bash
cd backend
docker build -t transitops-api .
```

Frontend (multi-stage build: Node builder → nginx runtime, gzip-compressed, cache-fingerprinted
SPA with an `/api` reverse proxy configured at container start via `envsubst`):

```bash
cd frontend
docker build -t transitops-web .
docker run -p 8080:80 -e API_UPSTREAM=http://host.docker.internal:4000 transitops-web
```

---

## ⚙️ Environment Variables

### Backend — see [`backend/.env.example`](backend/.env.example)

Key variables: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`,
`CORS_ORIGINS`, `RATE_LIMIT_*`. **Set strong secrets in production.**

### Frontend — see [`frontend/.env.example`](frontend/.env.example)

| Variable             | Default                 | Description                                                        |
| --------------------- | ------------------------ | -------------------------------------------------------------------- |
| `VITE_API_URL`       | `/api/v1`               | Base URL the browser uses for API calls (relative → nginx proxy). |
| `VITE_PROXY_TARGET`  | `http://localhost:4000` | Dev-only: where the Vite proxy forwards `/api`.                   |
| `API_UPSTREAM`       | `http://api:4000`       | Container-only: backend the nginx runtime proxies `/api` to.      |

---

## ⚙️ Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · TanStack Query · React Hook Form + Zod · Recharts |
| Backend runtime / framework | Node.js 20 · Express · TypeScript |
| Database / ORM | PostgreSQL 16 · Prisma |
| Auth | JWT (access + rotating refresh) · bcrypt |
| Validation | Zod (also the source of the OpenAPI schemas) |
| Logging | Winston + request ids |
| Docs | Swagger / OpenAPI 3 |
| Container | Docker · Docker Compose |
</content>
