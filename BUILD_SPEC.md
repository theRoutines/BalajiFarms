# Master Build Prompt: Dairy Farm E-Commerce Platform

Paste this whole document into your AI coding tool. It describes every file, every rule and every test. Build in the phases listed in section 16.

## 0. How you must work

- Build the phases in section 16 in order. After each phase, run it (`docker compose up`, then the tests) and fix everything before moving on.
- Write every file in full. No placeholders, no `...`, no TODO stubs, no pseudo-code.
- If something is ambiguous, choose the simplest option that fits this document and list the choice in the README under 'Decisions'.
- Do not add libraries, features or files that are not in this document.
- Frontend and backend must match the API contract in section 8 exactly (paths, field names, response shape).

## 1. Product overview

A web store for a dairy farm selling **ghee, mustard oil and groundnut oil**. Each product has **variants** (for example 500ml, 1L, 5L), each with its own SKU, price and stock. The brand name is a placeholder constant (`BRAND_NAME = 'Green Pasture Dairy'`) in `client/src/utils/constants.js` and `server/src/config/env.js` so the client can rename it in one place.

**Customers** browse products, keep a cart, pay with Razorpay, track the order live, read the farm story and see live herd statistics.

**Admin** manages products, variants and stock, orders, herd records and delivery zones.

**Delivery staff** see packed orders, mark them out for delivery, and complete them with a customer OTP. The brand delivers by itself.

**In scope:** auth, catalog with variants, client-side cart, pincode serviceability and delivery fee, safe checkout with stock reservation, Razorpay payment with webhook, order state machine, status history, socket updates, email notifications, admin panel, delivery view, herd statistics, farm story pages.

**Out of scope (do not build):** reviews, invoices, coupons, subscriptions, live GPS, SMS or WhatsApp, saved address book, product image upload (images are URL or path strings).

## 2. Code quality rules (most important section)

1. **JavaScript only**, ES modules in both server and client. No TypeScript.
2. **Easy to read beats clever.** No nested ternaries, no deep chaining, no metaprogramming, no generic base classes. Plain functions and plain objects.
3. **Do not over-shorten.** Use named intermediate variables, early returns and one idea per line. Never merge unrelated logic just to save lines.
4. **Do not over-engineer.** No repository layer, no dependency injection, no event bus, no abstractions used only once. Flow is always: route, controller, service, Prisma.
5. **Controllers** only read the request, call one service function and send the response. **Services** hold all business rules and throw `AppError` on failure.
6. Keep files under about 200 lines. One responsibility per file.
7. Put a short comment above each non-obvious block saying **why** it exists (locking, idempotency, webhook checks, state transitions). Do not write comments that repeat the code.
8. No dead code, unused imports, commented-out code or stray `console.log`. Logging is allowed only at server start-up and in worker or error handlers (`console.error`).
9. Names: server files are camelCase with a role suffix (`orderService.js`, `orderController.js`, `orderRoutes.js`). React components are PascalCase `.jsx`. Variables describe what they hold (`reservationExpiresAt`, not `exp`).
10. **Response shape** (every endpoint): success is `{ success: true, data: ... }`, failure is `{ success: false, message: '...', errors?: [...] }`.
11. Every request body, query and param is validated with Zod before reaching a controller. Every error flows through the central `errorHandler`.
12. **Money is an integer in paise** in the database, the API and all server code. Only the client's `formatMoney` converts to rupees for display.

## 3. Tech stack

| Area | Choice |
| --- | --- |
| Runtime | Node.js 20, Express 4 |
| Database | PostgreSQL 16 with **Prisma** ORM (pgAdmin is optional and only for viewing data) |
| Cache, queues, rate limit store | Redis 7 |
| Queues | BullMQ |
| Realtime | Socket.IO with Redis adapter |
| Payments | Razorpay (test mode) |
| Email | Nodemailer; **Mailpit** container catches emails in development (UI on port 8025) |
| Validation | Zod |
| Auth | bcryptjs, jsonwebtoken, httpOnly cookies |
| Security | helmet, cors, express-rate-limit with rate-limit-redis |
| Server tests | Vitest and Supertest against a real test Postgres database |
| Frontend | React 18, Vite, React Router 6, Axios, Tailwind CSS 3, socket.io-client, react-hot-toast |
| Frontend tests | Vitest, React Testing Library, jsdom |
| Containers | Docker and Docker Compose. No CI or CD. |

## 4. Repository structure

```
dairy-platform/
  docker-compose.yml
  .gitignore
  README.md
  docker/postgres/init.sql          # creates the dairy_test database
  k6/checkout-load.js               # optional load test
  server/
    package.json
    Dockerfile
    .dockerignore
    .env.example
    vitest.config.js
    prisma/schema.prisma
    prisma/seed.js
    scripts/simulateWebhook.js      # dev helper: sends a signed fake Razorpay webhook
    src/
      server.js                     # starts HTTP, sockets, workers
      app.js                        # builds the Express app
      config/    env.js db.js redis.js razorpay.js
      middleware/ authenticate.js requireRole.js validate.js rateLimiters.js errorHandler.js
      utils/     AppError.js asyncHandler.js money.js orderStateMachine.js tokens.js otp.js orderNumber.js
      validators/ authValidators.js productValidators.js orderValidators.js adminValidators.js deliveryValidators.js
      services/  authService.js catalogService.js deliveryZoneService.js checkoutService.js
                 stockService.js orderService.js paymentService.js refundService.js
                 herdService.js notificationService.js
      controllers/ authController.js productController.js orderController.js paymentController.js
                 adminController.js deliveryController.js herdController.js
      routes/    index.js authRoutes.js productRoutes.js orderRoutes.js paymentRoutes.js
                 adminRoutes.js deliveryRoutes.js herdRoutes.js
      sockets/   index.js socketEmitter.js
      queues/    queues.js startWorkers.js emailWorker.js expiryWorker.js reconciliationWorker.js
      emails/    mailer.js templates.js
    tests/
      setup/globalSetup.js setup/testHelpers.js
      stateMachine.test.js pricing.test.js auth.test.js checkout.test.js
      stock.concurrency.test.js webhook.test.js expiry.test.js orderFlow.test.js
  client/
    package.json Dockerfile .dockerignore vite.config.js tailwind.config.js postcss.config.js index.html
    public/images/                  # placeholder product and farm images
    src/
      main.jsx App.jsx index.css
      api/        axiosClient.js authApi.js productApi.js orderApi.js herdApi.js adminApi.js deliveryApi.js
      context/    AuthContext.jsx CartContext.jsx
      hooks/      useOrderSocket.js
      utils/      constants.js formatMoney.js loadRazorpay.js
      components/ layout/ common/ product/ cart/ orders/ herd/ admin/
      pages/      public/ customer/ admin/ delivery/
      tests/      formatMoney.test.js CartContext.test.jsx OrderTimeline.test.jsx ProtectedRoute.test.jsx
```

## 5. Database schema (`server/prisma/schema.prisma`)

Use this schema as written.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role { CUSTOMER ADMIN DELIVERY }
enum OrderStatus { PENDING_PAYMENT PAID PACKED OUT_FOR_DELIVERY DELIVERED CANCELLED EXPIRED }
enum PaymentStatus { CAPTURED FAILED REFUNDED AMOUNT_MISMATCH }
enum CattleType { COW BULL CALF }
enum CowCategory { MILKING DRY PREGNANT HEIFER }

model User {
  id            Int      @id @default(autoincrement())
  name          String
  email         String   @unique
  phone         String
  passwordHash  String
  role          Role     @default(CUSTOMER)
  createdAt     DateTime @default(now())
  orders        Order[]
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        Int       @id @default(autoincrement())
  userId    Int
  tokenHash String    @unique
  expiresAt DateTime
  revokedAt DateTime?
  user      User      @relation(fields: [userId], references: [id])
}

model Product {
  id          Int       @id @default(autoincrement())
  name        String
  slug        String    @unique
  description String
  imageUrl    String
  isActive    Boolean   @default(true)
  variants    Variant[]
}

model Variant {
  id         Int         @id @default(autoincrement())
  productId  Int
  sku        String      @unique
  label      String
  pricePaise Int
  stock      Int
  isActive   Boolean     @default(true)
  product    Product     @relation(fields: [productId], references: [id])
  orderItems OrderItem[]
  @@index([productId])
}

model DeliveryZone {
  id               Int     @id @default(autoincrement())
  pincode          String  @unique
  areaName         String
  deliveryFeePaise Int
  isActive         Boolean @default(true)
}

model Order {
  id                   Int                  @id @default(autoincrement())
  orderNumber          String               @unique
  userId               Int
  status               OrderStatus          @default(PENDING_PAYMENT)
  subtotalPaise        Int
  deliveryFeePaise     Int
  totalPaise           Int
  shippingAddress      Json
  idempotencyKey       String
  razorpayOrderId      String?              @unique
  reservationExpiresAt DateTime
  deliveryOtpHash      String?
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
  user                 User                 @relation(fields: [userId], references: [id])
  items                OrderItem[]
  payments             Payment[]
  history              OrderStatusHistory[]
  @@unique([userId, idempotencyKey])
  @@index([status, reservationExpiresAt])
}

model OrderItem {
  id             Int     @id @default(autoincrement())
  orderId        Int
  variantId      Int
  productName    String
  variantLabel   String
  unitPricePaise Int
  quantity       Int
  order          Order   @relation(fields: [orderId], references: [id])
  variant        Variant @relation(fields: [variantId], references: [id])
}

model Payment {
  id                Int           @id @default(autoincrement())
  orderId           Int
  razorpayPaymentId String        @unique
  amountPaise       Int
  status            PaymentStatus
  method            String?
  createdAt         DateTime      @default(now())
  order             Order         @relation(fields: [orderId], references: [id])
}

model WebhookEvent {
  id         Int      @id @default(autoincrement())
  eventId    String   @unique
  eventType  String
  receivedAt DateTime @default(now())
}

model OrderStatusHistory {
  id         Int          @id @default(autoincrement())
  orderId    Int
  fromStatus OrderStatus?
  toStatus   OrderStatus
  changedBy  String
  note       String?
  createdAt  DateTime     @default(now())
  order      Order        @relation(fields: [orderId], references: [id])
}

model Cattle {
  id        Int          @id @default(autoincrement())
  tagId     String       @unique
  type      CattleType
  breed     String
  category  CowCategory?
  isActive  Boolean      @default(true)
  createdAt DateTime     @default(now())
}
```

Notes: `category` is only set for cows. Bulls and calves have `category = null`. `changedBy` holds values such as `system`, `webhook`, `user:5`, `admin:1`, `delivery:3`.

## 6. Business rules (the safety core)

### 6.1 Pricing

- The client sends only `variantId` and `quantity`. **The server reads prices from the database.** The client's displayed total is never trusted.
- `subtotalPaise = sum(unitPricePaise * quantity)`. `deliveryFeePaise` comes from the active `DeliveryZone` for the shipping pincode. `totalPaise = subtotalPaise + deliveryFeePaise`.
- `OrderItem` stores a snapshot (`productName`, `variantLabel`, `unitPricePaise`), so later price changes never alter old orders.
- Limits: quantity per line 1 to 10, at most 10 lines per order.

### 6.2 Checkout (`checkoutService.createCheckout`)

1. Validate input (Zod): `items[]`, `shippingAddress` (name, phone, line1, line2 optional, city, state, 6-digit pincode), and the `Idempotency-Key` header (required, 8 to 64 characters).
2. If an order already exists for `(userId, idempotencyKey)`, return it without creating anything. This makes double clicks and retries harmless.
3. Check the pincode zone is active. If not, throw 400 'We do not deliver to this pincode yet'.
4. Load the variants (active, with active product). Missing or inactive variant: 400.
5. **One Prisma transaction**: sort items by `variantId` (prevents deadlocks), then for each item run an atomic conditional update `variant.updateMany({ where: { id, isActive: true, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } })`. If `count` is 0, throw 409 'Not enough stock for \<product> \<variant>' (the transaction rolls back every earlier decrement). Then create the `Order` (`PENDING_PAYMENT`, `reservationExpiresAt = now + RESERVATION_MINUTES`), the `OrderItem` rows and the first history row.
6. If the insert fails on the `(userId, idempotencyKey)` unique constraint (two simultaneous identical requests), fetch and return the existing order.
7. After the transaction commits, create the Razorpay order (`amount = totalPaise`, `currency = INR`, `receipt = orderNumber`) and save `razorpayOrderId`. If Razorpay fails, cancel the order with `transitionOrder` (stock is released) and throw 502.
8. Schedule the expiry job (`scheduleOrderExpiry`) and return `{ order, payment: { keyId, razorpayOrderId, amountPaise, currency } }`.

### 6.3 Stock

- Stock is decremented at checkout (a reservation) and given back **exactly once** when an unpaid order is cancelled or expired. The give-back runs inside the same transaction as the status change (6.5), so it cannot run twice.
- Postgres is the single source of truth for stock. Redis is not used for stock.

### 6.4 Order state machine (`utils/orderStateMachine.js`)

| From | Allowed next |
| --- | --- |
| PENDING\_PAYMENT | PAID, CANCELLED, EXPIRED |
| PAID | PACKED, CANCELLED |
| PACKED | OUT\_FOR\_DELIVERY, CANCELLED |
| OUT\_FOR\_DELIVERY | DELIVERED |
| DELIVERED, CANCELLED, EXPIRED | none (final) |

Export `canTransition(from, to)` and `getAllowedNextStatuses(from)`.

### 6.5 The only way to change a status: `orderService.transitionOrder({ orderId, to, changedBy, note })`

1. Read the current status. If `canTransition(current, to)` is false, throw 409 `Cannot move order from X to Y`.
2. Inside one transaction: `order.updateMany({ where: { id, status: current }, data: { status: to } })`. **If count is 0, another request changed it first: throw 409.** This conditional update is what stops race conditions.
3. Insert an `OrderStatusHistory` row. If `to` is `CANCELLED` or `EXPIRED` and the previous status was `PENDING_PAYMENT`, give the reserved stock back (`stockService.releaseStock(tx, orderId)`).
4. After the transaction: emit the socket event (`emitOrderUpdate`) and enqueue the email (`notificationService.sendOrderStatusEmail`). Failures here are logged and never roll back the order.

No other code is allowed to write `order.status`.

### 6.6 Payment webhook (`paymentService.handleWebhook`)

- Route `POST /api/payments/webhook` uses `express.raw({ type: 'application/json' })` and is mounted **before** `express.json()` so the exact raw bytes can be verified.
- Verify `x-razorpay-signature` equals HMAC SHA256 of the raw body with `RAZORPAY_WEBHOOK_SECRET`, compared with `crypto.timingSafeEqual`. Invalid: 400, do nothing.
- **Deduplicate:** insert the `x-razorpay-event-id` into `WebhookEvent`. If it already exists (unique error), return 200 and stop.
- `payment.captured`: find the order by `razorpayOrderId`. Then:
  - Amount differs from `order.totalPaise`: store a `Payment` with `AMOUNT_MISMATCH`, do not mark paid, log an error.
  - Status is `PENDING_PAYMENT`: insert the `Payment` (`CAPTURED`; `razorpayPaymentId` is unique) and call `transitionOrder` to `PAID` with `changedBy = 'webhook'`.
  - Status is `EXPIRED` or `CANCELLED` (money arrived after the stock was released): insert the `Payment`, refund it with `refundService`, mark the `Payment` as `REFUNDED`.
  - Any other status: the payment is a duplicate, ignore it.
- `payment.failed`: store a `Payment` with `FAILED`. The order stays `PENDING_PAYMENT`, so the customer can retry until it expires.
- Always answer 200 after valid, handled events so Razorpay stops retrying. Return 500 only for unexpected errors so Razorpay retries.

### 6.7 Expiry and reconciliation

- **Expiry job:** a delayed BullMQ job per order runs at `reservationExpiresAt`. It calls `transitionOrder` to `EXPIRED` only if the order is still `PENDING_PAYMENT`. If the transition fails with 409 (paid in the meantime), ignore it.
- **Reconciliation job** (repeats every 5 minutes): (a) for each `PENDING_PAYMENT` order older than 2 minutes with a `razorpayOrderId`, ask Razorpay for that order's payments; if one is `captured`, process it with the same function the webhook uses; (b) expire any `PENDING_PAYMENT` order whose `reservationExpiresAt` has passed (safety net if a delayed job was lost).

### 6.8 Refunds (`refundService`)

- `refundPayment(razorpayPaymentId, amountPaise)` calls the Razorpay refund API. Used by the late-payment case and by admin cancel.
- Admin cancels a `PAID` or `PACKED` order: `transitionOrder` to `CANCELLED`, then refund the captured payment and mark it `REFUNDED`. Stock is not restored automatically for these orders (the goods may already be packed); the admin edits stock by hand.

### 6.9 Delivery OTP

- When an order becomes `OUT_FOR_DELIVERY`, generate a 6-digit OTP, store only its bcrypt hash in `deliveryOtpHash`, and email the plain OTP to the customer.
- `DELIVERED` requires the correct OTP in the request body. Wrong OTP: 400 and the status is unchanged.

### 6.10 Notifications

- `notificationService` builds the email data and calls `enqueueEmail` (BullMQ queue `email`, 5 attempts, exponential backoff starting at 5 seconds).
- Emails are sent on: payment confirmed (PAID), PACKED, OUT\_FOR\_DELIVERY (includes OTP), DELIVERED, CANCELLED (mentions refund when applicable), EXPIRED.

## 7. Backend files, one by one

Add one extra file to the tree in section 4: `services/fulfillmentService.js` (admin and delivery order actions). Every file below must be complete and runnable.

### 7.1 Setup and config

| File | What it contains |
| --- | --- |
| `server/package.json` | `"type": "module"`. Dependencies: express, cors, helmet, cookie, cookie-parser, express-rate-limit, rate-limit-redis, ioredis, bullmq, socket.io, @socket.io/redis-adapter, @prisma/client, zod, bcryptjs, jsonwebtoken, razorpay, nodemailer, dotenv. Dev: prisma, vitest, supertest. Scripts: `dev` (`node --watch src/server.js`), `start`, `test`, `db:migrate` (`prisma migrate deploy`), `db:migrate:dev`, `db:seed`. |
| `.env.example` | `NODE_ENV`, `PORT=5000`, `CLIENT_URL=http://localhost:5173`, `DATABASE_URL`, `TEST_DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_MINUTES=15`, `REFRESH_TOKEN_DAYS=7`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SMTP_HOST=mailpit`, `SMTP_PORT=1025`, `EMAIL_FROM`, `RESERVATION_MINUTES=15`. |
| `config/env.js` | Loads dotenv, validates every variable with Zod, exports one frozen `env` object (numbers already converted). The app refuses to start if a variable is missing. Also exports `BRAND_NAME`. |
| `config/db.js` | Exports one shared `PrismaClient`. |
| `config/redis.js` | Exports `createRedisConnection()` (ioredis with `maxRetriesPerRequest: null`, required by BullMQ) and a shared `redis` client. |
| `config/razorpay.js` | Exports the Razorpay SDK instance built from the env keys. |
| `vitest.config.js` | Node environment, `globalSetup` pointing to `tests/setup/globalSetup.js`, `fileParallelism: false` (tests share one database), `NODE_ENV=test`. |

### 7.2 Utils and middleware

| File | What it contains |
| --- | --- |
| `utils/AppError.js` | `class AppError extends Error` with `statusCode`. Used for every expected failure. |
| `utils/asyncHandler.js` | Wraps an async controller and forwards errors to `next`. |
| `utils/money.js` | `calculateSubtotal(lines)`, `calculateTotal(subtotalPaise, feePaise)`, `formatRupees(paise)` (only for email text). |
| `utils/orderStateMachine.js` | Transition table from 6.4, `canTransition`, `getAllowedNextStatuses`. |
| `utils/tokens.js` | `signAccessToken(user)`, `verifyAccessToken(token)`, `generateRefreshToken()` (random 64 hex), `hashToken(token)` (sha256), `setAuthCookies(res, access, refresh)`, `clearAuthCookies(res)`. Cookies: `httpOnly`, `sameSite: 'lax'`, `secure` only in production. The refresh cookie uses `path: '/api/auth'`. |
| `utils/otp.js` | `generateOtp()` (6 digits, `crypto.randomInt`), `hashOtp(otp)`, `verifyOtp(otp, hash)` using bcrypt. |
| `utils/orderNumber.js` | Returns `DM-YYYYMMDD-XXXXX` with 5 random uppercase letters or digits. |
| `middleware/authenticate.js` | Reads the `accessToken` cookie, verifies it, loads the user (`id, name, email, role`) from the database, sets `req.user`. 401 if missing, invalid or user not found. |
| `middleware/requireRole.js` | `requireRole('ADMIN', 'DELIVERY')` returns middleware that answers 403 for other roles. |
| `middleware/validate.js` | `validate({ body, query, params })` runs Zod schemas and replaces the request values with the parsed ones. Failures go to `errorHandler` as a `ZodError`. |
| `middleware/rateLimiters.js` | Redis-backed limiters: `authLimiter` (10 requests per 15 minutes per IP, on login and register), `checkoutLimiter` (10 per minute per user id), `apiLimiter` (300 per minute per IP). All return the standard error JSON with 429. All are skipped when `NODE_ENV=test`. The webhook route is never rate limited (its signature protects it). |
| `middleware/errorHandler.js` | Maps `AppError` to its status, `ZodError` to 400 with a readable `errors` list, Prisma `P2002` to 409, anything else to 500 with a generic message (log with `console.error`, never send stack traces). Also exports a `notFoundHandler` for unknown routes (404). |

### 7.3 Validators (Zod schemas, one file per area)

- `authValidators.js`: register (name 2 to 80 chars, email, phone 10 digits, password 8 to 72 chars with at least one letter and one number), login.
- `productValidators.js`: slug param; admin create or update product; create or update variant (`pricePaise` and `stock` non-negative integers).
- `orderValidators.js`: checkout body (`items` 1 to 10 with `variantId` and `quantity` 1 to 10, no duplicate `variantId`; `shippingAddress`), `Idempotency-Key` header schema, order id param, admin order list query (`status`, `page`, `pageSize` max 50).
- `adminValidators.js`: zone create or update (pincode 6 digits), cattle create or update (a `COW` must have a `category`; `BULL` and `CALF` must not).
- `deliveryValidators.js`: `pincode` query, complete-delivery body (`otp` is 6 digits).

### 7.4 Services (all business logic lives here)

| File | Functions |
| --- | --- |
| `authService.js` | `registerUser` (hash password with bcrypt, role always `CUSTOMER`, unique email check), `loginUser` (same message 'Invalid email or password' for unknown email and wrong password), `refreshSession` (checks the stored hash is not revoked or expired, revokes it, issues a new pair; if a revoked token is reused, revoke all of that user's tokens), `logoutUser` (revoke the token). |
| `catalogService.js` | Storefront: `listProducts` (active products with active variants, ordered by id), `getProductBySlug`. Admin: `listAllProducts`, `createProduct`, `updateProduct`, `createVariant`, `updateVariant` (stock is set to an absolute number). |
| `deliveryZoneService.js` | `checkPincode(pincode)` (404 if not found or inactive), plus admin `listZones`, `createZone`, `updateZone`. |
| `checkoutService.js` | `createCheckout` exactly as in 6.2, and `getPaymentSession(userId, orderId)` which returns the Razorpay payload again for an order that is still `PENDING_PAYMENT` and not past `reservationExpiresAt` (so a customer who closed the payment window can pay again). |
| `stockService.js` | `releaseStock(tx, orderId)`: for each order item, increment the variant stock inside the given transaction. |
| `orderService.js` | `transitionOrder` (6.5), `expireOrderIfUnpaid(orderId)` (calls `transitionOrder` to `EXPIRED` and ignores a 409), `listMyOrders`, `getMyOrder(userId, orderId)` (404 for other people's orders), `cancelMyOrder` (only from `PENDING_PAYMENT`), and a `toOrderResponse` helper that removes `deliveryOtpHash`. |
| `fulfillmentService.js` | `listAdminOrders`, `getAdminOrder`, `markPacked`, `adminCancelOrder` (cancel, then refund via `refundService`), `listDeliveryOrders` (`PACKED` and `OUT_FOR_DELIVERY`), `startDelivery` (6.9: transition, create OTP, save hash, email it), `completeDelivery` (check OTP, then transition to `DELIVERED`). |
| `paymentService.js` | `verifyWebhookSignature`, `handleWebhook`, `processCapturedPayment` (shared by the webhook and the reconciliation job), `recordFailedPayment`. |
| `refundService.js` | `refundPayment(razorpayPaymentId, amountPaise)` and `refundOrderPayments(orderId)`. |
| `herdService.js` | `getHerdStats()` returns `{ total, cows, bulls, calves, milkingCows, byCategory: { MILKING, DRY, PREGNANT, HEIFER }, byBreed: [{ breed, count }] }`, computed with Prisma `groupBy` over active cattle (never typed by hand). Admin: `listCattle`, `addCattle`, `updateCattle` (use `isActive: false` to retire an animal). |
| `notificationService.js` | `sendOrderStatusEmail(order, toStatus, extra)` picks the template, adds the customer's email, and calls `enqueueEmail`. |

Controllers are thin wrappers (one per service area) that call the service functions above and send `{ success: true, data }`. Routes map to controllers exactly as in the API contract (section 8). `routes/index.js` mounts every router under `/api`.

### 7.5 Sockets, queues, emails, app and server

| File | What it contains |
| --- | --- |
| `sockets/index.js` | `initSocket(httpServer)`: Socket.IO with CORS for `CLIENT_URL` with credentials, the Redis adapter, and an auth middleware that reads the `accessToken` from the cookie header, verifies it and loads the user. A connected user joins room `user:<id>`; admins also join `staff:admin`; delivery staff also join `staff:delivery`. Unauthenticated connections are rejected. |
| `sockets/socketEmitter.js` | Holds the `io` instance (`setIo`) and `emitOrderUpdate(order)`: emits `order:update` with `{ orderId, orderNumber, status, updatedAt }` to `user:<order.userId>` and `staff:admin`, and also to `staff:delivery` when the status is `PAID`, `PACKED`, `OUT_FOR_DELIVERY` or `DELIVERED`. If `io` is not set (tests), it does nothing. |
| `queues/queues.js` | Three BullMQ queues (`email`, `order-expiry`, `reconciliation`) and the helpers `enqueueEmail(data)`, `scheduleOrderExpiry(orderId, delayMs)` (job id `expire-<orderId>`), `scheduleReconciliation()` (repeat every 5 minutes). In tests these helpers are mocked. |
| `queues/emailWorker.js` | Worker that sends each email job through `mailer.sendEmail`. |
| `queues/expiryWorker.js` | Worker that calls `expireOrderIfUnpaid(orderId)`. |
| `queues/reconciliationWorker.js` | Worker that runs the two checks from 6.7. |
| `queues/startWorkers.js` | Starts the three workers and attaches `failed` handlers that `console.error` the job id and reason. |
| `emails/mailer.js` | Nodemailer SMTP transport (`SMTP_HOST`, `SMTP_PORT`) and `sendEmail({ to, subject, html })`. |
| `emails/templates.js` | One function per email from 6.10, each returning `{ subject, html }`. A shared `layout(title, bodyHtml)` adds the brand header, and an items table with rupee amounts is used where it helps. Inline styles only. |
| `app.js` | Builds the app in this order: `helmet`, `cors({ origin: CLIENT_URL, credentials: true })`, `cookie-parser`, the payment router with `express.raw` (webhook), `express.json({ limit: '100kb' })`, `apiLimiter`, `/api` routes (plus `GET /api/health`), `notFoundHandler`, `errorHandler`. Exports `app` without listening, so Supertest can use it. |
| `server.js` | Creates the HTTP server from `app`, calls `initSocket`, `startWorkers`, `scheduleReconciliation`, listens on `PORT`, and on `SIGTERM` closes the server, workers and Prisma. |

### 7.6 Seed and dev scripts

- `prisma/seed.js` (idempotent, uses `upsert`): users `admin@dairy.test` (ADMIN), `delivery@dairy.test` (DELIVERY), `customer@dairy.test` (CUSTOMER), all with password `Password123`; products and variants: **Pure Cow Ghee** (250g, 500g, 1kg), **Cold-Pressed Mustard Oil** (500ml, 1L, 5L), **Groundnut Oil** (500ml, 1L, 5L), each variant with a realistic price and stock between 20 and 60; delivery zones for 5 sample pincodes with fees between 0 and 6000 paise; cattle: 24 cows (mix of Gir, Sahiwal, Rathi and Holstein Friesian; categories spread across `MILKING`, `DRY`, `PREGNANT`, `HEIFER`), 3 bulls, 6 calves, with tag ids like `COW-001`.
- `scripts/simulateWebhook.js`: takes a Razorpay order id and an amount in paise, builds a `payment.captured` payload, signs it with `RAZORPAY_WEBHOOK_SECRET`, and POSTs it to `/api/payments/webhook`. This lets the developer test payments locally without a public URL.

## 8. API contract

All paths start with `/api`. Auth uses httpOnly cookies, so the client always sends `withCredentials: true`. IDs are integers. Money fields end in `Paise`.

**Order object** returned by every order endpoint: `{ id, orderNumber, status, subtotalPaise, deliveryFeePaise, totalPaise, shippingAddress, reservationExpiresAt, createdAt, updatedAt, items: [{ id, variantId, productName, variantLabel, unitPricePaise, quantity }], history: [{ fromStatus, toStatus, changedBy, note, createdAt }] }`. Admin and delivery responses also include `user: { name, email, phone }`. `deliveryOtpHash` and secrets are never returned.

| Method and path | Who | Request | Response `data` |
| --- | --- | --- | --- |
| `GET /health` | public | none | `{ status: 'ok' }` |
| `POST /auth/register` | public | `{ name, email, phone, password }` | 201 `{ user }` |
| `POST /auth/login` | public | `{ email, password }` | `{ user }` and sets cookies |
| `POST /auth/refresh` | refresh cookie | none | `{ user }` and sets new cookies |
| `POST /auth/logout` | public | none | `{}` and clears cookies |
| `GET /auth/me` | logged in | none | `{ user: { id, name, email, role } }` |
| `GET /products` | public | none | `{ products: [{ id, name, slug, description, imageUrl, variants: [{ id, sku, label, pricePaise, stock }] }] }` |
| `GET /products/:slug` | public | none | `{ product }` |
| `GET /delivery/check?pincode=` | public | query | `{ pincode, areaName, deliveryFeePaise }` or 404 |
| `GET /herd/stats` | public | none | stats from `getHerdStats` |
| `POST /orders/checkout` | customer | header `Idempotency-Key`, body `{ items: [{ variantId, quantity }], shippingAddress: { name, phone, line1, line2, city, state, pincode } }` | 201 `{ order, payment: { keyId, razorpayOrderId, amountPaise, currency } }` |
| `GET /orders` | customer | none | `{ orders }` newest first |
| `GET /orders/:id` | customer (owner) | none | `{ order }` |
| `GET /orders/:id/payment-session` | customer (owner) | none | `{ payment }` |
| `POST /orders/:id/cancel` | customer (owner) | none | `{ order }` (only while `PENDING_PAYMENT`) |
| `POST /payments/webhook` | Razorpay | raw JSON plus signature headers | `{ received: true }` |
| `GET /admin/orders` | admin | `?status&page&pageSize` | `{ orders, total, page, pageSize }` |
| `GET /admin/orders/:id` | admin | none | `{ order }` |
| `POST /admin/orders/:id/pack` | admin | none | `{ order }` |
| `POST /admin/orders/:id/cancel` | admin | none | `{ order }` (refund if paid) |
| `GET /admin/products` | admin | none | `{ products }` including inactive |
| `POST /admin/products` | admin | `{ name, slug, description, imageUrl }` | 201 `{ product }` |
| `PATCH /admin/products/:id` | admin | partial product fields, `isActive` | `{ product }` |
| `POST /admin/products/:id/variants` | admin | `{ sku, label, pricePaise, stock }` | 201 `{ variant }` |
| `PATCH /admin/variants/:id` | admin | partial `label, pricePaise, stock, isActive` | `{ variant }` |
| `GET /admin/zones`, `POST /admin/zones`, `PATCH /admin/zones/:id` | admin | `{ pincode, areaName, deliveryFeePaise, isActive }` | `{ zones }` or `{ zone }` |
| `GET /admin/cattle`, `POST /admin/cattle`, `PATCH /admin/cattle/:id` | admin | `{ tagId, type, breed, category, isActive }` | `{ cattle }` (list) or `{ animal }` |
| `GET /delivery/orders` | delivery or admin | none | `{ orders }` with status `PACKED` or `OUT_FOR_DELIVERY` |
| `POST /delivery/orders/:id/start` | delivery or admin | none | `{ order }` |
| `POST /delivery/orders/:id/complete` | delivery or admin | `{ otp }` | `{ order }` |

## 9. Socket contract

- The client connects to the same origin (`io({ withCredentials: true })`); the Vite dev proxy forwards `/socket.io` to the server. The server authenticates from the cookie.
- Server to client event: `order:update` with `{ orderId, orderNumber, status, updatedAt }`.
- Customers receive updates for their own orders only. Admin and delivery rooms are described in 7.5.
- The event carries no sensitive data. The client reacts by refetching the order from the API, which keeps the REST API the single source of truth and keeps the socket code tiny.

## 10. Frontend files, one by one

The look: warm, natural and premium. Cream background (`#FBF7EE`), forest green (`#2F5D3A`) as the main colour, gold (`#C9962B`) for accents, charcoal text. Headings use Playfair Display, body text uses Inter (loaded from Google Fonts in `index.html`). Rounded cards, soft shadows, generous spacing, large farm photography, mobile-first responsive layout, visible focus states and `alt` text on every image.

### 10.1 Setup

| File | What it contains |
| --- | --- |
| `package.json` | Dependencies: react, react-dom, react-router-dom, axios, socket.io-client, react-hot-toast. Dev: vite, @vitejs/plugin-react, tailwindcss@3, postcss, autoprefixer, vitest, jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event. Scripts: `dev` (`vite --host`), `build`, `preview`, `test` (`vitest run`). |
| `vite.config.js` | React plugin; dev server on port 5173; proxy for `/api` and `/socket.io` (with `ws: true`) to `process.env.VITE_PROXY_TARGET` (default `http://localhost:5000`); Vitest config with `jsdom` and a setup file that imports `@testing-library/jest-dom`. |
| `tailwind.config.js`, `postcss.config.js`, `index.css` | The palette and fonts above as theme extensions, Tailwind directives, and a few base styles. No other CSS files. |
| `index.html` | Title, font links, root div, `main.jsx`. |
| `main.jsx` | Renders `App` inside `BrowserRouter`, `AuthProvider`, `CartProvider`, and the react-hot-toast `Toaster`. |

### 10.2 API layer (`src/api/`)

Every function returns `response.data.data` (the unwrapped payload) and throws an `Error` whose `message` is the server's message.

| File | Contains |
| --- | --- |
| `axiosClient.js` | Axios instance with `baseURL: '/api'` and `withCredentials: true`. A response interceptor: on a 401 from any non-auth URL, call `POST /auth/refresh` once (a single shared promise, so parallel failures refresh only once), then retry the original request. If refresh fails, dispatch a `window` event `auth:logout`. Converts errors into `Error(message)` with a `status` property. |
| `authApi.js` | `registerUser`, `loginUser`, `logoutUser`, `getCurrentUser`. |
| `productApi.js` | `getProducts`, `getProductBySlug`. |
| `orderApi.js` | `checkPincode`, `createCheckout(payload, idempotencyKey)` (sends the `Idempotency-Key` header), `getMyOrders`, `getMyOrder`, `getPaymentSession`, `cancelOrder`. |
| `herdApi.js` | `getHerdStats`. |
| `adminApi.js` | Functions for every `/admin/...` endpoint in section 8. |
| `deliveryApi.js` | `getDeliveryOrders`, `startDelivery`, `completeDelivery`. |

### 10.3 Context, hooks and utils

| File | Contains |
| --- | --- |
| `context/AuthContext.jsx` | State: `user`, `isLoading`. On mount calls `getCurrentUser` (a 401 simply means logged out). Exposes `login`, `register`, `logout`, `isAdmin`, `isDelivery`. Listens for the `auth:logout` event and clears the user. |
| `context/CartContext.jsx` | Items shaped `{ variantId, productName, variantLabel, imageUrl, pricePaise, quantity, maxStock }`, saved in `localStorage` under `dairy_cart`. Functions: `addItem` (merges the same variant, caps quantity at 10 and at stock), `updateQuantity`, `removeItem`, `clearCart`. Derived: `itemCount`, `subtotalPaise` (display only; the server recalculates). |
| `hooks/useOrderSocket.js` | `useOrderSocket(onUpdate)`: when a user is logged in, opens `io({ withCredentials: true })`, calls `onUpdate(payload)` for each `order:update`, and disconnects on cleanup. |
| `utils/constants.js` | `BRAND_NAME`, status labels, the timeline steps (`PENDING_PAYMENT`, `PAID`, `PACKED`, `OUT_FOR_DELIVERY`, `DELIVERED`), badge colours per status. |
| `utils/formatMoney.js` | `formatMoney(paise)` returns `₹499` or `₹1,234.56` (Indian grouping, decimals only when needed). |
| `utils/loadRazorpay.js` | Adds the Razorpay `checkout.js` script once and returns a promise that resolves when it is ready. |

### 10.4 Components

| Folder | Components |
| --- | --- |
| `layout/` | `Layout` (Navbar, `Outlet`, Footer). `Navbar` (brand, Shop, Our Farm, cart with item count badge, Login or a user menu with My Orders and, by role, Admin or Delivery, Logout; hamburger menu on mobile). `Footer` (brand, short tagline, links). |
| `common/` | `Button` (primary, outline, danger; `isLoading` state), `Loader`, `ErrorMessage`, `EmptyState`, `StatusBadge`, `FormField` (label, input, error text), `QuantityStepper`, `ImageWithFallback` (shows a green placeholder block if the image fails), `Modal`, `ProtectedRoute` (props: `roles`; shows `Loader` while auth loads, sends anonymous users to `/login` remembering the page, sends wrong roles to `/`). |
| `product/` | `ProductCard` (image, name, 'From ₹X', link), `VariantSelector` (pill buttons, out-of-stock ones disabled, 'Only N left' when stock is 5 or less). |
| `cart/` | `CartItemRow`, `CartSummary` (subtotal, note that delivery is calculated at checkout, checkout button). |
| `orders/` | `OrderTimeline` (the 5 steps, completed steps highlighted, timestamps from history; for `CANCELLED` and `EXPIRED` it shows a clear banner instead), `OrderCard` (list item), `OrderItemsTable` (items and totals). |
| `herd/` | `HerdStatCard` (large number and label), `CategoryBreakdown` (labelled horizontal bars built with plain divs), `BreedList`. |
| `admin/` | `AdminSidebar`, `DataTable` (simple table driven by a columns array), `ProductForm`, `VariantForm`, `ZoneForm`, `CattleForm`. |

### 10.5 Pages and routes (`App.jsx`)

| Route | Page | Access | What it does |
| --- | --- | --- | --- |
| `/` | `HomePage` | public | Hero with farm photo and 'Shop now'; three product highlights from the API; trust points (pure, traditional, farm to door); a herd numbers strip (total cattle, milking cows) from `getHerdStats`; story teaser linking to `/our-farm`. |
| `/shop` | `ShopPage` | public | Product grid with loading, error and empty states. |
| `/shop/:slug` | `ProductDetailPage` | public | Image, description, `VariantSelector`, `QuantityStepper`, add to cart (toast confirmation). |
| `/our-farm` | `OurFarmPage` | public | Story sections (our beginning, how ghee is made, how oil is pressed, how we care for our animals), then **live herd statistics**: stat cards (total, cows, bulls, calves, milking), `CategoryBreakdown` for cow categories, `BreedList`; then a trust section for certificates and lab reports (placeholder images). |
| `/login`, `/register` | `LoginPage`, `RegisterPage` | public | Forms with validation messages; after login go back to the page the user came from. |
| `/cart` | `CartPage` | public | Items, quantity changes, summary. |
| `/checkout` | `CheckoutPage` | customer | See 11.3. |
| `/orders` | `OrdersPage` | customer | List of `OrderCard`s. |
| `/orders/:id` | `OrderDetailPage` | customer | See 11.4. |
| `/admin` (index redirects to `/admin/orders`) | `AdminLayout` with nested pages | admin | `AdminOrdersPage` (status filter tabs, paginated table, Pack and Cancel buttons with a confirmation modal), `AdminProductsPage` (products with variants, inline price and stock edit, add product, add variant), `AdminZonesPage`, `AdminHerdPage` (live stats on top, cattle table, add and edit form). |
| `/delivery` | `DeliveryOrdersPage` | delivery or admin | Cards for `PACKED` and `OUT_FOR_DELIVERY` orders: address, tap-to-call phone, items. `PACKED` shows 'Start delivery'. `OUT_FOR_DELIVERY` shows an OTP input and 'Complete delivery'. Refreshes on socket events. |
| `*` | `NotFoundPage` | public | Friendly 404. |

## 11. Frontend and backend connection rules

### 11.1 Same origin, no cookie trouble

The browser only talks to the Vite dev server. It proxies `/api` and `/socket.io` to the Express server, so cookies are first-party and no CORS problem appears. Never hard-code `http://localhost:5000` anywhere in the client.

### 11.2 Rules that keep both sides aligned

- Prices, totals and stock always come from the API. The cart total on screen is only a preview.
- All rupee display goes through `formatMoney`. All other code uses paise.
- Field names in forms and API calls match section 8 exactly.
- Every API failure shows its `message` in a toast, except where a page shows it inline (checkout stock errors).

### 11.3 Checkout flow (`CheckoutPage`)

1. Redirect to `/cart` if the cart is empty. Show the address form (name, phone, line1, line2, city, state, pincode).
2. When the pincode has 6 digits, call `checkPincode`. Show the delivery fee, or 'We do not deliver here yet' and disable payment.
3. Show the order summary with subtotal, delivery fee and total (preview).
4. Create an idempotency key with `crypto.randomUUID()` in a `useRef`. Keep the same key for retries and double clicks; create a new one only when the cart contents change. Disable the Pay button while the request runs.
5. Call `createCheckout`. A 409 stock error is shown inline with the product name and the user can edit the cart.
6. Load Razorpay and open it with `key = payment.keyId`, `order_id = payment.razorpayOrderId`, `amount`, `currency`, `name = BRAND_NAME`, and the user's name, email and phone as prefill. Clear the cart as soon as the order exists.
7. In the Razorpay `handler`, go to `/orders/:id?justPaid=1`. In `modal.ondismiss`, go to `/orders/:id` (the order page offers Pay again). **The client never marks anything as paid.**

### 11.4 Order tracking (`OrderDetailPage`)

- Loads the order, shows `OrderTimeline`, items, address, totals and the status history.
- Uses `useOrderSocket`: when an update arrives for this order id, refetch the order.
- If the status is `PENDING_PAYMENT`: show a countdown to `reservationExpiresAt`, a **Pay now** button (calls `getPaymentSession`, then opens Razorpay) and a **Cancel order** button. With `?justPaid=1`, show 'Confirming your payment...' and also refetch every 3 seconds for up to 60 seconds, as a fallback if the socket is slow.
- If `OUT_FOR_DELIVERY`: show 'Share the OTP we emailed you with our delivery partner when your order arrives.'
- `CANCELLED` and `EXPIRED` show a clear banner; a paid order that was cancelled mentions that a refund is on its way.

### 11.5 Auth behaviour

On app load the client calls `/auth/me`. Protected pages wait for that call before deciding. When an access token expires, the Axios interceptor refreshes it silently. When refresh fails, the user is logged out and sent to `/login`.

## 12. Docker

One command starts everything: `docker compose up --build`.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: dairy
      POSTGRES_PASSWORD: dairy
      POSTGRES_DB: dairy
    ports:
      - 5432:5432
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: [CMD-SHELL, pg_isready -U dairy -d dairy]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    ports:
      - 6379:6379
    healthcheck:
      test: [CMD, redis-cli, ping]
      interval: 5s
      timeout: 3s
      retries: 10

  mailpit:
    image: axllent/mailpit
    ports:
      - 8025:8025
      - 1025:1025

  server:
    build: ./server
    env_file: ./server/.env
    ports:
      - 5000:5000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./server:/app
      - /app/node_modules
    command: sh -c 'npx prisma migrate deploy && npm run dev'

  client:
    build: ./client
    ports:
      - 5173:5173
    environment:
      VITE_PROXY_TARGET: http://server:5000
    depends_on:
      - server
    volumes:
      - ./client:/app
      - /app/node_modules

  pgadmin:
    image: dpage/pgadmin4
    profiles: [tools]
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@dairy.test
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - 5050:80

  k6:
    image: grafana/k6
    profiles: [load]
    environment:
      BASE_URL: http://server:5000
    volumes:
      - ./k6:/scripts
    command: run /scripts/checkout-load.js
    depends_on:
      - server

volumes:
  pgdata:
```

- `docker/postgres/init.sql` contains `CREATE DATABASE dairy_test;` (it only runs the first time the Postgres volume is created; the README must say how to create the test database manually if the volume already exists).
- `server/Dockerfile`: `node:20-bookworm-slim`, install `openssl` with apt (Prisma needs it), `WORKDIR /app`, copy `package*.json`, `npm install`, copy `prisma`, `npx prisma generate`, copy the rest, `EXPOSE 5000`, `CMD npm start`.
- `client/Dockerfile`: `node:20-alpine`, `WORKDIR /app`, copy `package*.json`, `npm install`, copy the rest, `EXPOSE 5173`, `CMD npm run dev`.
- `.dockerignore` (both): `node_modules`, `.env`, `dist`, `coverage`. `.gitignore`: the same plus `.DS_Store`.
- Production note for the README: build the client with `npm run build` and serve `dist` from any static host or Nginx, and run the server container with `npm start`. Not required for this project.

## 13. Testing

### 13.1 Server tests (Vitest and Supertest, real Postgres)

**Setup**

- `tests/setup/globalSetup.js` runs `prisma migrate deploy` against `TEST_DATABASE_URL`. `vitest.config.js` sets `DATABASE_URL` to the test database and `RATE_LIMIT_ENABLED=false`. Add `RATE_LIMIT_ENABLED` (default `true`) to `config/env.js` and `.env.example`; limiters are skipped when it is `false`.
- `tests/setup/testHelpers.js`: `resetDatabase()` (truncate every table with `RESTART IDENTITY CASCADE`), `createUser(role)`, `loginAs(user)` (returns a Supertest agent that keeps cookies), `createProductWithVariant({ stock, pricePaise })`, `createZone(pincode, feePaise)`, `buildCheckoutBody(variantId, quantity, pincode)`, `signWebhookBody(payload)`.
- Mocks in every test file that needs them: `vi.mock` for `src/queues/queues.js` (so `enqueueEmail` and `scheduleOrderExpiry` are spies) and for `src/config/razorpay.js` (fake `orders.create` returning incrementing ids, fake `payments.refund`, fake `orders.fetchPayments`). No test touches the real Razorpay or SMTP.
- Run with: `docker compose exec server npm test`.

**Test files and what each must prove**

| File | Assertions |
| --- | --- |
| `stateMachine.test.js` | Every allowed transition returns true. Illegal ones return false (`PAID` to `PENDING_PAYMENT`, `PENDING_PAYMENT` to `PACKED`, anything out of `DELIVERED`, `CANCELLED` or `EXPIRED`). `getAllowedNextStatuses` matches the table. |
| `pricing.test.js` | Subtotal and total maths. A checkout body that includes a fake `pricePaise` still produces a total from database prices. |
| `auth.test.js` | Register works; duplicate email gives 409; weak password gives 400; a `role` field in the body is ignored. Login sets both cookies; wrong password and unknown email give the same 401 message. `/auth/me` needs the cookie. Refresh rotates the token and the old one stops working; reusing an old token revokes all tokens of that user. A customer gets 403 on `/admin/*` and `/delivery/orders`. |
| `checkout.test.js` | Success creates a `PENDING_PAYMENT` order, decrements stock and returns the Razorpay payload. Same `Idempotency-Key` twice returns the same order and decrements stock once. Unserviceable pincode gives 400. Inactive variant gives 400. Missing header gives 400. Two items where the second lacks stock gives 409 and the first item's stock is unchanged (rollback). Cancel by the customer restores stock; a second cancel gives 409 and stock is restored only once. |
| `stock.concurrency.test.js` | **30 customers checkout at the same time for a variant with 10 in stock (quantity 1 each): exactly 10 get 201, 20 get 409, final stock is 0, exactly 10 orders exist.** One customer sends the same key 10 times in parallel: one order and one stock decrement. |
| `webhook.test.js` | Bad signature gives 400 and changes nothing. A valid `payment.captured` makes the order `PAID` with one `Payment` and one history row. **The same event replayed 5 times in parallel leaves one `Payment` and one `PAID` history row.** A different event id with the same payment id creates no second payment. A wrong amount does not mark the order paid. A payment on an `EXPIRED` order triggers a refund, the order stays `EXPIRED` and the payment is `REFUNDED`. `payment.failed` leaves the order `PENDING_PAYMENT`. |
| `expiry.test.js` | `expireOrderIfUnpaid` expires a pending order and restores stock. A `PAID` order is untouched. Calling it twice restores stock once. The reconciliation helper marks a pending order `PAID` when the fake Razorpay reports a captured payment. |
| `orderFlow.test.js` | Full journey through the API: checkout, webhook (`PAID`), admin pack, delivery start (read the OTP from the spied email call), wrong OTP gives 400, correct OTP gives `DELIVERED`, history has the five transitions in order, one email was enqueued per status. Another customer gets 404 for this order. Admin cancel on a `PAID` order refunds and marks it `CANCELLED`. |

### 13.2 Client tests (Vitest and React Testing Library)

| File | Assertions |
| --- | --- |
| `formatMoney.test.js` | `0` gives `₹0`, `49900` gives `₹499`, `123456` gives `₹1,234.56`. |
| `CartContext.test.jsx` | Adding the same variant merges quantities; quantity is capped at 10 and at stock; update and remove work; the cart survives a reload through `localStorage`; subtotal is correct. |
| `OrderTimeline.test.jsx` | Shows all five steps, marks steps up to the current status as done, and shows the banner for `CANCELLED` and `EXPIRED`. |
| `ProtectedRoute.test.jsx` | Anonymous users are redirected to `/login`; the right role sees the page; the wrong role is redirected home; a loader shows while auth is loading. |

### 13.3 Load test (`k6/checkout-load.js`, optional)

- `setup()` registers 50 customers through the API, logs each in, and (using the seeded admin) sets the stock of one variant to 10.
- Each virtual user sends checkouts for that variant with a unique `Idempotency-Key`. A check asserts the status is only 201 or 409, never 500.
- `teardown()` reads the variant stock and the order count and fails if stock is negative or if orders created do not equal stock removed.
- Run with `docker compose --profile load run --rm k6` and with `RATE_LIMIT_ENABLED=false` in `server/.env`. Remember to switch it back to `true` afterwards.

## 14. README.md (write it for a new developer)

Contents: what the project is; a plain ASCII architecture diagram (browser, Vite or static host, Express, Postgres, Redis, Razorpay, Mailpit); first-time setup (copy both `.env.example` files, `docker compose up --build`, create the first migration with `docker compose run --rm server npx prisma migrate dev --name init` and commit `prisma/migrations`, run `docker compose exec server npm run db:seed`); URLs (client 5173, API 5000, Mailpit 8025, pgAdmin 5050 with `--profile tools`); demo accounts; Razorpay test keys and webhook setup (events `payment.captured` and `payment.failed`; locally use `scripts/simulateWebhook.js` or a tunnel); how to run server tests, client tests and the k6 load test; a 'How payments stay safe' list (server-side prices, atomic stock update, idempotency key, signed and deduplicated webhooks, guarded state machine, expiry and reconciliation, audit history); a short folder guide; and the 'Decisions' list.

## 15. Debuggability checklist (applies to every file)

- A new developer can open any file and understand it in one read; a service function reads top to bottom like a recipe.
- Every thrown `AppError` has a message a human can act on.
- Status changes, stock changes and payments each have exactly one code path, found by searching for `transitionOrder`, `releaseStock`, and `processCapturedPayment`.
- No file imports from a layer above it (services never import controllers or routes).

## 16. Build phases and definition of done

| Phase | Build | Checkpoint before moving on |
| --- | --- | --- |
| 1. Scaffolding | Repo, Docker Compose, Dockerfiles, env files, Prisma schema and first migration, seed, `app.js`, `server.js`, `/api/health`, client shell with Tailwind. | `docker compose up` works; `/api/health` answers; client opens; seed runs. |
| 2. Core backend | Config, utils, middleware, validators, auth, catalog, delivery zones, herd stats. | `stateMachine`, `pricing` and `auth` tests pass. |
| 3. Safe commerce | Checkout, stock, order service and state machine, payment webhook, refunds, expiry and reconciliation workers. | `checkout`, `stock.concurrency`, `webhook` and `expiry` tests pass. |
| 4. Fulfilment and realtime | Fulfilment service, delivery OTP, sockets, email queue and templates, admin and delivery routes. | `orderFlow` test passes; emails visible in Mailpit. |
| 5. Frontend foundation | API layer, contexts, layout, common components, auth pages, shop, product detail, home, farm story and herd stats. | Browsing, login and herd stats work against the real API. |
| 6. Frontend commerce | Cart, checkout with Razorpay, orders list, live order tracking. | A test-mode payment ends with the order page turning `PAID` live without a refresh. |
| 7. Staff UIs | Admin orders, products, zones, herd, and the delivery page. | An order can be packed, delivered with OTP, and the customer sees every step live. |
| 8. Polish | Responsive pass, empty and error states, client tests, README, k6 script, full test run. | Everything in the checklist below. |

**Definition of done**

- `docker compose up --build` starts the whole system from a clean machine and the README steps are correct.
- All server and client tests pass.
- A real Razorpay test-mode payment works end to end, including the webhook.
- Replaying the same webhook, double-clicking Pay, or buying the last item from two accounts never produces a duplicate payment, a duplicate order or negative stock.
- No file breaks the rules in section 2, and every endpoint matches section 8.
