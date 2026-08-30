# iPhone Man API

This `backend/` folder is treated as the `apps/api` backend from `../INSTRUCTIONS.md` until the full monorepo layout is introduced.

The API follows strict MVCS architecture: routes -> controllers -> services -> models. Database access is raw PostgreSQL through `pg` only, and customer accounts are intentionally out of scope.

## Environment

There is no committed `.env.example`; create `.env` in `backend/` (it is gitignored, `.gitignore:3`). The following variables are required and validated at startup by `src/config/env.ts`:

```
NODE_ENV
PORT
DATABASE_URL
DB_SSL
CORS_ORIGIN
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN
BCRYPT_ROUNDS
COOKIE_DOMAIN
```

In addition to the admin JWT secrets, the maintenance module (Section 39 of `../INSTRUCTIONS.md`) uses its own independent JWT secrets:

```
MAINTENANCE_JWT_ACCESS_SECRET=...
MAINTENANCE_JWT_REFRESH_SECRET=...
```

## Database

Run migrations, then seed:

```
npm run migrate:up
npm run seed
```

The seed creates an admin (`admin@iphoneman.test` / `Admin12345`) plus maintenance users (`repair.admin@iphoneman.test` and `repair.worker@iphoneman.test`, both / `Maintain123`) and a couple of sample repair jobs.

## Auth flows

**Login / refresh:** `POST /{admin,maintenance}/auth/login` mints a short-lived access JWT plus a refresh JWT whose opaque `tokenId` is stored (sha256-hashed) in `admin_refresh_tokens` / `maintenance_refresh_tokens`. `POST .../auth/refresh` rotates the token in a single transaction — the presented token is revoked and a new one issued, so a reused/rotated (i.e. stolen) token is detected and revokes all of that user's sessions (401 `INVALID_REFRESH_TOKEN` / `MAINTENANCE_INVALID_REFRESH_TOKEN`). `logout` revokes the presented token server-side, so the cookie stops working immediately.

**Password reset:** `POST .../auth/request-password-reset` with `{ email }` generates a cryptographically random 64-hex single-use token (30-minute TTL; only its sha256 hash is stored in `admin_password_reset_tokens` / `maintenance_password_reset_tokens`) and emails it. `POST .../auth/reset-password` with `{ resetToken, newPassword }` consumes it atomically — one-time use, and the response is identical whether or not the email exists. The old shared static reset token was removed.

## API surface

The storefront API (`products`, `categories`, `brands`, `cart`, `checkout`, `orders`, `coupons`, `reviews`, `search`) and the admin API (`/api/v1/admin/*`) are implemented per Sections 16-17 of `../INSTRUCTIONS.md`.

### Search

`GET /api/v1/search?q=` returns active products matching the query against product name, description, brand name, or category name, with pagination via `meta`.

### Admin analytics

`GET /api/v1/admin/analytics/overview` returns computed metrics instead of stubs: revenue and order volume (this week / this month), top-selling products, low-stock warnings, and a recent orders feed.

### Maintenance Service Module (Section 39)

A fully independent module for tracking in-house repair jobs. It uses its own `maintenance_users` / `maintenance_jobs` tables, its own JWT secrets, and its own auth guard (`requireMaintenanceAuth` / `requireMaintenanceRole`) — completely separate from the admin `admin_users` auth.

Routes:

```
POST   /api/v1/maintenance/auth/login
POST   /api/v1/maintenance/auth/logout
POST   /api/v1/maintenance/auth/refresh
POST   /api/v1/maintenance/auth/request-password-reset
POST   /api/v1/maintenance/auth/reset-password

GET    /api/v1/maintenance/jobs            (worker: own jobs; admin: all, optional ?month=YYYY-MM)
POST   /api/v1/maintenance/jobs            (worker/admin; workers are always assigned to themselves)
GET    /api/v1/maintenance/jobs/:id
PATCH  /api/v1/maintenance/jobs/:id        (admin)
DELETE /api/v1/maintenance/jobs/:id        (admin)
GET    /api/v1/maintenance/jobs/export?month=YYYY-MM   (admin — downloads an .xlsx workbook)
```

`net_amount` (`customer_price - cost_price`) and `net_profit` (`net_amount - net_amount * percentage / 100`) are always computed server-side in the service layer and never trusted from client input. The monthly export workbook includes per-job rows plus a totals row.

## Scripts

- `npm run dev` — run the API with hot reload
- `npm run build` — type-check and compile to `dist/`
- `npm run start` — run the compiled API
- `npm run lint` — ESLint
- `npm test` — Vitest (integration tests mock the service layer)
