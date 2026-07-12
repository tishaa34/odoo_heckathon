# TransitOps — Frontend

A production-grade web client for **TransitOps**, a Smart Transport Operations Platform for logistics companies. It replaces spreadsheets, notebooks and WhatsApp with a single, role-aware operations dashboard for managing **fleet, drivers, trips, maintenance, fuel, expenses and analytics**.

Built with **React 18 · TypeScript · Vite · Tailwind CSS · TanStack Query · React Hook Form + Zod · Recharts**.

---

## ✨ Highlights

- **Role-based access control (RBAC)** — navigation and actions adapt to the signed-in role (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst). Unauthorized routes are blocked at the router.
- **Full trip lifecycle** — Draft → Dispatched → In Progress → Completed / Cancelled, with **live capacity validation** and backend business-rule errors surfaced inline.
- **Real-time-feel data** — optimistic invalidation via TanStack Query keeps KPIs, tables and charts in sync after every action.
- **Design system** — reusable Button, Input, Select, Modal, Table, Badge, Pagination, KPI Card, Chart wrappers, Skeletons, Empty/Error states and Toasts.
- **Light & dark themes**, fully **responsive** (desktop / tablet / mobile with a collapsing sidebar).
- **Robust auth** — access + refresh tokens with silent refresh on 401 and forced logout on failure.
- **Accessibility** — semantic HTML, labelled inputs, keyboard-navigable dialogs, ARIA attributes, visible focus rings.
- **CSV export** on every data-heavy screen.

---

## 🚀 Quick start (Docker — the whole stack)

From the **repository root** (this builds Postgres + API + Web together):

```bash
docker compose up --build
```

Then open:

| Service   | URL                                   |
| --------- | ------------------------------------- |
| Web app   | http://localhost:8080                 |
| API       | http://localhost:4000/api/v1          |
| API docs  | http://localhost:4000/api/v1/docs     |

The database is auto-migrated and **seeded** on first boot. Nginx proxies `/api` from the web container to the API container, so there is **no CORS setup and nothing to configure** — just open the browser.

### Demo accounts

All demo users share the password **`Password123!`**:

| Role              | Email                       |
| ----------------- | --------------------------- |
| Fleet Manager     | `manager@transitops.com`    |
| Dispatcher        | `dispatcher@transitops.com` |
| Safety Officer    | `safety@transitops.com`     |
| Financial Analyst | `finance@transitops.com`    |

The login screen has **one-click demo fill** buttons for each role.

---

## 🧑‍💻 Local development

Requires **Node 20+**. Run the backend separately (see `../backend/README.md`) or point at any TransitOps API.

```bash
cd frontend
cp .env.example .env      # optional — sensible defaults are baked in
npm install
npm run dev               # http://localhost:5173
```

The Vite dev server proxies `/api` → `VITE_PROXY_TARGET` (default `http://localhost:4000`), so the browser stays same-origin.

### Scripts

| Command             | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start the dev server (HMR)                |
| `npm run build`     | Type-check (`tsc -b`) + production build  |
| `npm run preview`   | Preview the production build locally      |
| `npm run test`      | Run the Vitest unit/component test suite  |
| `npm run lint`      | Type-only lint pass                       |

---

## ⚙️ Environment variables

| Variable             | Default                 | Description                                                        |
| -------------------- | ----------------------- | ----------------------------------------------------------------- |
| `VITE_API_URL`       | `/api/v1`               | Base URL the browser uses for API calls (relative → nginx proxy). |
| `VITE_PROXY_TARGET`  | `http://localhost:4000` | Dev-only: where the Vite proxy forwards `/api`.                   |
| `API_UPSTREAM`       | `http://api:4000`       | Container-only: backend the nginx runtime proxies `/api` to.      |

---

## 🏗 Architecture

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

- **Separation of concerns** — UI components never call `axios`. Data access lives in `services/api`, orchestration in `hooks/*`, and pages compose the two. This keeps components dumb, testable and reusable.
- **One envelope, one error shape** — `services/http.ts` normalizes the backend's `{ success, message, code, errors[] }` envelope. Business-rule violations (HTTP 422) are shown as toasts _and_ mapped back onto the offending form fields.
- **RBAC is data-driven** — a single `NAV_ITEMS` / `WRITE_ACCESS` config in `constants/` drives sidebar visibility, route guards and per-row action buttons, mirroring the backend's `authorize()` rules.
- **Query-key discipline** — centralized keys (`services/queryClient.ts`) make cache invalidation after mutations predictable across modules (e.g. dispatching a trip refreshes trips, vehicles, drivers and the dashboard).
- **Theme via CSS variables** — components use the same class names in light and dark; only the token values change.

---

## 🔐 RBAC matrix

| Module      | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
| ----------- | :-----------: | :--------: | :------------: | :---------------: |
| Fleet       |   Full        |   View     |      —         |       View        |
| Drivers     |   Full        |    —       |     Full       |        —          |
| Trips       |   Full        |   Full     |     View       |        —          |
| Maintenance |   Full        |    —       |     Full       |        —          |
| Fuel/Exp.   |   Full        |   Fuel     |      —         |       Full        |
| Analytics   |   Full        |    —       |      —         |       Full        |

---

## 🧪 Testing

Vitest + Testing Library cover formatting utilities, status-badge mapping and the login form (validation + demo fill). Run:

```bash
npm run test
```

---

## 🐳 Docker (frontend only)

```bash
cd frontend
docker build -t transitops-web .
docker run -p 8080:80 -e API_UPSTREAM=http://host.docker.internal:4000 transitops-web
```

The image is a **multi-stage build** (Node builder → nginx runtime) serving a gzip-compressed, cache-fingerprinted SPA with an `/api` reverse proxy configured at container start via `envsubst`.
