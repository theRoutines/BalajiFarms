# Balaji Farms

Balaji Farms is a dairy-farm e-commerce platform for ghee, mustard oil and groundnut oil. Phase 2 adds the core backend: validated configuration, cookie-based authentication, product catalog, delivery-zone checks, herd statistics, and admin catalog/zone/herd management.

## Architecture

```text
Browser
  |
  +--> Vite client (5173) -- /api and /socket.io --> Express server (5000)
                                                        |
                           +----------------------------+------------------+
                           |                            |                  |
                       PostgreSQL 16                 Redis 7          SMTP server
                       local database                 optional          optional
                           |
                       parameterized pg SQL

Express server ------------------------------> Razorpay (test mode, later phase)
```

## First-time setup without Docker

Prerequisites: Node.js 20+, PostgreSQL 16+, Redis 7, and npm. Redis was optional for phase 2, but Phase 3 uses it for BullMQ expiry and reconciliation queues. Keep `RATE_LIMIT_ENABLED=false` if you do not want Redis-backed rate limiting; Redis itself is still required for checkout jobs.

1. Create the PostgreSQL role and databases using `psql` as a PostgreSQL administrator:

   ```text
   CREATE USER dairy WITH PASSWORD 'dairy';
   CREATE DATABASE dairy OWNER dairy;
   CREATE DATABASE dairy_test OWNER dairy;
   ```

   If your local PostgreSQL credentials differ, update `server/.env` accordingly. The initial SQL migration is committed at `server/sql/migrations/001_init.sql`.
2. Install and prepare the server:

   ```text
   cd server
   copy .env.example .env
   npm install
   npm run db:migrate
   npm run db:seed
   ```

3. Start the API in the `server` directory:

   ```text
   npm run dev
   ```

4. In a second terminal, install and start the client:

   ```text
   cd client
   copy .env.example .env
   npm install
   npm run dev
   ```

To enable Redis-backed rate limiting, start a local Redis server and set `RATE_LIMIT_ENABLED=true` in `server/.env`.

## URLs

- Client: http://localhost:5173
- API health check: http://localhost:5000/api/health

## Demo accounts

The seed creates these accounts, all with password `Password123`:

- `admin@dairy.test`
- `delivery@dairy.test`
- `customer@dairy.test`

## Phase 2 API highlights

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/products`, `GET /api/products/:slug`
- `GET /api/delivery/check?pincode=...`
- `GET /api/herd/stats`
- `POST /api/orders/checkout`, customer order history, cancellation and payment sessions
- `POST /api/payments/webhook` with signed Razorpay payloads
- Admin catalog, delivery-zone and cattle routes under `/api/admin/*`

All responses use `{ success: true, data: ... }` or `{ success: false, message: ... }`. Authentication uses httpOnly cookies; the server reads product prices and herd counts from PostgreSQL.

## Folder guide

- `server/sql`: PostgreSQL migrations and seed scripts
- `server/src`: Express app, configuration, middleware, services, controllers and routes
- `client/src`: the React and Tailwind application shell

## Decisions

- The existing root Vite starter remains untouched while the documented `client/` application is established, so no user-provided starter assets are removed.
- Phase 2 keeps the exact response envelope on every implemented endpoint and validates request data with Zod before controllers run.
- Local development uses checked-out `server/.env` and `client/.env` files; both are ignored by Git and contain local connection settings and placeholder payment credentials.

## Later-phase safety and operations

The planned payment flow will use server-side prices, atomic stock updates, idempotency keys, signed and deduplicated webhooks, a guarded state machine, expiry and reconciliation, and audit history. Razorpay test keys, webhook setup, server tests, client tests and the k6 load test are added in their respective build phases.

## Production note

Build the client with `npm run build` and serve `dist` from a static host or Nginx. Run the server with `npm start`. Production deployment is not required for Phase 2.
