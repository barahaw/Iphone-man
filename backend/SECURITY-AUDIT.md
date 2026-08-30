# Backend Security Audit

**Date:** 2026-08-06
**Scope:** `backend/src`, `backend/migrations`, `backend/seeds`, `backend/package.json`, `.gitignore`, `.env` (variable names only), integration tests.
**Method:** Every file listed in scope was read in full (all models, services, controllers, routes, middleware, validators, utils, config, docs, migrations, seeds, tests). Static analysis + `npm audit --json` (run 2026-08-06). No code was modified.

---

## Executive Summary

| Severity | Count |
|---|---|
| Critical | 3 |
| High | 3 |
| Medium | 8 |
| Low | 5 |
| Informational | 8 |

**Remediation status (2026-08-06):** the top-severity auth and business-logic findings are fixed — per-system single-use DB-backed password reset tokens (§2 Critical), refresh-token rotation with server-side revocation (§2 High), refresh-failure 401 mapping (§2 Medium), checkout stock + coupon TOCTOU races (§3), `inStock` coercion (§4), and the seed production guard (§5). Fixed findings are marked **(FIXED)** below. The abuse-surface (rate limiting, PII-trimming) and dependency findings remain open.

The codebase is clean on SQL injection (fully parameterized), CORS/headers, and role-based route guarding. The most serious issues are concentrated in four areas:

1. **Password reset previously used a static, shared, 8-char reset token** reused across the *admin* and *maintenance* systems — a single-point-of-failure account takeover for both and a break of the "fully independent" requirement. **(FIXED:** each system now issues per-request, single-use, 30-minute, DB-backed reset tokens — §2.)
2. **Checkout stock/coupon handling was a TOCTOU race** — the stock pre-check ran outside the transaction and the atomic decrement return value was never inspected, so concurrent checkouts could oversell. **(FIXED:** atomic `RETURNING`-based decrements inside the transaction — §3.)
3. **Refresh tokens were stateless JWTs that were never revoked or rotated server-side** — a stolen refresh cookie was replayable for the full 7-day lifetime. **(FIXED:** DB-backed rotation + revocation — §2.)
4. **Public unauthenticated endpoints with no rate limit / length bounds** (`/coupons/validate`, `/reviews`) allow coupon-code enumeration, past-customer email verification, and storage abuse. **(Still open.)**

---

## 1. SQL Injection

**Checked, no issue found.** Every query in every model uses `$1, $2, ...` placeholders with values passed in the parameter array — verified file-by-file:

- `src/models/admin-user.model.ts:13-29`, `src/models/maintenance-user.model.ts:12-29` — parameterized.
- `src/models/product.model.ts:30-87` (`list`) — dynamic WHERE clauses are assembled as `... = $N` with each value pushed into the `values[]` array (`:36, :41, :47, :52, :57`). The only non-parameterized fragment is `p.stock_quantity > 0` / `p.stock_quantity = 0` built from the boolean `filters.inStock` (`:59-61`) — not user-controllable text.
- `src/models/product.model.ts:63-69` — dynamic `ORDER BY` is a **lookup into a hardcoded whitelist map** (`price_asc`, `price_desc`, `newest`, `rating`, `popular`) keyed by an enum-validated `filters.sort`; a raw column name is never derived from user input. Safe.
- `src/models/product.model.ts:94-123` (`search`), `:125-241` (`findById`, `create`, `update`, `delete`, `replaceTranslations`, `decrementStock`) — all parameterized.
- `src/models/order.model.ts:23-53, 55-58, 60-78, 80-89, 91-104, 106-117` — all parameterized, including the status filter built with `$${values.length}` (`:66`) and `hasCompletedOrderForProduct` (`:92-101`).
- `src/models/maintenance-job.model.ts:44-62, 64-67, 69-99, 101-133, 135-138, 140-159` — all parameterized; the `month` filter is `to_char(created_at, 'YYYY-MM') = $1` against a regex-validated value (`:80`).
- `src/models/brand.model.ts`, `category.model.ts`, `cart.model.ts`, `coupon.model.ts`, `review.model.ts`, `analytics.model.ts` — all parameterized.
- No `sql\`...\`` template literals, no `pg`-style string concatenation of user input, no ORM raw queries.

One note: `product.model.ts:36` wraps `filters.q` in `%${filters.q}%` **before** parameterization — the `%`/`_` wildcards are then interpreted by `ILIKE`. This is not injection (the value is still bound), but an attacker can use `%` to broaden matches. Cosmetic; no action required.

---

## 2. Authentication & JWT

### [CRITICAL] Static shared reset token — cross-system account takeover (FIXED)
- **Original finding:** Both the admin and the maintenance `reset-password` endpoints authenticated against the **same single static secret** (a shared env var with an 8-char minimum, validated in `src/config/env.ts`). This directly violated the "fully independent" requirement of INSTRUCTIONS.md §39 (separate auth systems): a reset token issued for admin also reset maintenance users and vice versa. It was also **not** single-use, **not** per-request, and **not** time-limited.
- **Impact (pre-fix):** One leaked secret reset the password of *any* admin **and** *any* maintenance user on both systems, indefinitely, until the env var was rotated. The same token was also brute-forceable in principle (min length 8; the `/reset-password` endpoints are rate limited to 10/15 min/IP, which slows but does not stop distributed or slow brute force). It was a single point of failure for both backends.
- **Fix applied (2026-08-06):** Replaced with a DB-backed per-request reset-token store, **one table per system** (`admin_password_reset_tokens` / `maintenance_password_reset_tokens`, migration `003_reset_tokens.sql`, each with a user FK + index). `POST /api/v1/{admin,maintenance}/auth/request-password-reset` generates a cryptographically random 32-byte (64 hex char) token with a 30-minute TTL, stores only its sha256 hash (`src/utils/reset-token.ts`, `src/models/*-reset-token.model.ts`), and emails the raw token (`email.service.ts`). `POST /api/v1/{admin,maintenance}/auth/reset-password` now accepts `{ resetToken, newPassword }` (no email) and consumes the token atomically inside a transaction — single-use; a second attempt, expiry, or unknown token returns 401 `INVALID_RESET_TOKEN`. The request endpoint returns an identical generic message whether or not the email exists (no account enumeration). The old shared env var was removed from `src/config/env.ts`, `.env`, and all docs.

### [HIGH] Refresh tokens are never rotated or revoked — indefinite replay (FIXED)
- **Original finding:** `src/services/admin-auth.service.ts:33-49` (`refresh` issued a fresh access + refresh JWT and returned both; the old JWT was never invalidated), `src/services/maintenance-auth.service.ts:37-53` (same). No `admin_refresh_tokens` / `maintenance_refresh_tokens` table existed in `migrations/001_initial_schema.sql` or `migrations/002_maintenance_schema.sql`.
- **Issue:** Refresh tokens were stateless JWTs signed with `JWT_REFRESH_SECRET` / `MAINTENANCE_JWT_REFRESH_SECRET` (`src/utils/jwt.ts:21-25, 41-45`). "Rotation" meant just a new token was minted; the old one remained valid. A stolen httpOnly cookie could be replayed indefinitely until the 7-day expiry (`env.ts:22`), and logging out did not revoke anything (`controllers/admin-auth.controller.ts:32-35`, `maintenance-auth.controller.ts:32-35`).
- **Impact:** Refresh-token theft (XSS elsewhere, exfil of cookies, compromised device) = full session for up to 7 days with no kill-switch; logout gave a false sense of revocation.
- **Fix applied (2026-08-06):** Each refresh token now carries an opaque `tokenId` claim; only its sha256 hash + expiry are stored per user (`admin_refresh_tokens` / `maintenance_refresh_tokens`, migration `004_refresh_tokens.sql`). On login a row is created; on `refresh` the presented token's row is revoked and a new one inserted atomically in one transaction (true rotation — reusing an already-rotated token is treated as theft and revokes **all** of that user's refresh tokens); `logout` revokes the presented token server-side, so the cookie stops working immediately even though the JWT is unexpired. Missing/revoked/expired rows and invalid/expired JWTs all return 401. Unique index on `token_hash`; per-user index for family revocation.

### [MEDIUM] Invalid/expired refresh token returns HTTP 500 instead of 401 (FIXED)
- **Original finding:** `src/services/admin-auth.service.ts:38` and `src/services/maintenance-auth.service.ts:42` — `jwt.verify` threw `TokenExpiredError`/`JsonWebTokenError`, which is neither `ApiError` nor `ZodError`, so `error.middleware.ts:37-44` emitted a generic 500. Previously acknowledged in the docs (`src/docs/paths.ts`).
- **Impact:** Clients got 500 on an expected error condition; minor operational noise, no data leak (message is generic).
- **Fix applied (2026-08-06):** `verifyRefreshToken` **and** the server-side refresh-token DB lookup are wrapped in try/catch and throw `ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.")` (maintenance: `MAINTENANCE_INVALID_REFRESH_TOKEN`). Expired, malformed, wrong-signature, and revoked tokens all map to 401 — never 500.

### [LOW] Admin vs maintenance JWT cross-usage depends on secret uniqueness
- **Location:** `src/utils/jwt.ts:15-53`.
- **Issue:** The two systems verify with different secrets (`JWT_ACCESS_SECRET` vs `MAINTENANCE_JWT_ACCESS_SECRET`, etc.), so an admin token cannot pass `requireMaintenanceAuth` and vice versa **only if the four secrets are actually distinct values in `.env`**. Nothing enforces this.
- **Impact:** If an operator reuses the same secret for both systems, a staff admin could access maintenance endpoints.
- **Fix:** Add a Zod `.refine()` in `env.ts` asserting all four secrets are pairwise distinct.

### [INFO] Checked — no role forgery path
- **Location:** `src/services/admin-auth.service.ts:20,44`; `src/services/maintenance-auth.service.ts:24,48`; middleware `src/middleware/admin-auth.middleware.ts:14`, `src/middleware/maintenance-auth.middleware.ts:14`.
- **Issue:** `role` is read from the DB row at login, embedded in the signed JWT, and re-read from the DB on refresh. It is never taken from client input anywhere. `requireRole` / `requireMaintenanceRole` read it only from the verified payload (`src/middleware/rbac.middleware.ts:6`, `src/middleware/maintenance-rbac.middleware.ts:6`). **No issue found.**

### [INFO] Checked — cookie hardening
- **Location:** `src/controllers/admin-auth.controller.ts:9-17`, `src/controllers/maintenance-auth.controller.ts:9-17`.
- **Issue:** Refresh cookies are `httpOnly: true`, `secure` in production, `sameSite: "strict"`, and path-scoped to `/api/v1/admin/auth/refresh` / `/api/v1/maintenance/auth/refresh`. This is correct (path scoping prevents the cookie being sent to other endpoints; Strict blocks CSRF). No `maxAge` is set (session cookie), which is fine since the JWT itself expires. **No issue found** (beyond the rotation issue above).

---

## 3. Authorization / IDOR / Business Logic

### [CRITICAL] Checkout stock check-and-decrement is a TOCTOU race → oversell
- **Location:** `src/services/checkout.service.ts:24-26` (stock pre-check) happens **outside** the transaction (the `withTransaction` begins at `:42`); `src/models/product.model.ts:225-241` (`decrementStock`) uses `UPDATE ... WHERE id = $2 AND stock_quantity >= $1` — atomic per row, but the **result row count is never inspected**, so a failed conditional update is silently ignored and the order is still committed.
- **Issue:** Two concurrent checkouts for the last unit of stock both pass the `product.stock_quantity < item.quantity` check (`:24`), both enter the transaction, both insert an order, and only one decrement actually applies (the second `UPDATE ... WHERE stock_quantity >= $1` matches 0 rows but returns normally). Net result: two orders for one unit of stock — **overselling**. Same pattern for `variantId` (`product.model.ts:226-233`), where the variant stock isn't even pre-checked at all.
- **Impact:** Lost revenue / inventory mismatch, stock can be driven to the `CHECK (stock_quantity >= 0)` boundary while more orders than units exist; order fulfillment breaks.
- **Fix:** Move the check *inside* the transaction and make the decrement authoritative: `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND stock_quantity >= $1 RETURNING id`, then **check `rowCount`/returning row** and `ROLLBACK` with `ApiError(409, "INSUFFICIENT_STOCK", ...)` if zero. Do the same for `product_variants`. Use `SELECT ... FOR UPDATE` (or a `RETURNING`-based decrement) for both the variant and product rows.

### [MEDIUM] Coupon usage-limit enforcement is also TOCTOU
- **Location:** `src/services/coupon.service.ts:34-36` (usage limit checked in `validate`), `src/services/checkout.service.ts:63-65` (calls `incrementUsage` inside the transaction), `src/models/coupon.model.ts:62-64` (`UPDATE coupons SET times_used = times_used + 1 WHERE code = $1` — unconditional, no `times_used < usage_limit` guard).
- **Issue:** `validate` runs before the transaction (`checkout.service.ts:35`). Concurrent checkouts that both pass validation when `times_used = usage_limit - 1` will both commit, exceeding the limit. The increment has no conditional guard, so it cannot be relied on to enforce the limit either.
- **Impact:** The last remaining coupon redemptions can be consumed by N simultaneous requests; a deliberate concurrency attack can use a limited coupon beyond its cap.
- **Fix:** Make the increment conditional and authoritative inside the transaction: `UPDATE coupons SET times_used = times_used + 1 WHERE code = $1 AND (usage_limit IS NULL OR times_used < usage_limit) RETURNING *`, and throw `ApiError(400, "COUPON_USAGE_LIMIT_REACHED", ...)` + rollback when it returns no row.

### [INFO] Checked — maintenance worker IDOR (read path)
- **Location:** `src/services/maintenance-job.service.ts:52-72` (`list` forces `workerId = actor.id` for workers), `:74-85` (`findById` returns 403 when `job.worker_id !== actor.id`), `:31-50` (`create` rejects `workerId` ≠ self for workers).
- **Issue:** A worker cannot read or list another worker's jobs by guessing IDs. Update/delete are worker-inaccessible because the routes are `requireMaintenanceRole("admin")` (`src/routes/maintenance-job.routes.ts:23-24`), and export is admin-only (`:20`, plus a redundant in-service check at `maintenance-job.service.ts:120-122`). **Verified — no worker IDOR.**
- **Defense-in-depth note:** the admin-only constraint for `update`/`delete` lives in the route layer only (`maintenance-job.service.ts:87, 111` take no `actor`). If a future route accidentally drops the guard, a worker could update/delete arbitrary jobs. Consider threading the actor into the service for both.

### [MEDIUM] Review verification is spoofable and doubles as an email oracle
- **Location:** `src/services/review.service.ts:7-14` — verification is `orderModel.hasCompletedOrderForProduct(input.reviewerEmail, input.productId)` (`src/models/order.model.ts:91-104`).
- **Issue:** The reviewer's email is only *matched* against a completed order for the product; there is no proof the submitter controls the email (no purchase token, no OTP, no email confirmation). Anyone who knows that "email X ordered product Y" can submit a review as X. Conversely the public, **unrate-limited** endpoint (`src/routes/review.routes.ts:12`) is a confirmation oracle: for a candidate email list, a `201 vs 403` outcome verifies that a specific email is a past customer of a specific product.
- **Impact:** Fake/reputation-tampering reviews for competitors or products; enumeration/confirmation of customers' emails and purchase history.
- **Fix:** Bind the review to the actual checkout (return a one-time opaque `reviewToken` in the order-confirmation email and require it), or at minimum (a) add a rate limiter, (b) bound comment length, (c) cap reviews per email+product, and (d) add a per-email dedup constraint. Note `emailService` currently only logs (`src/services/email.service.ts:1-9`) — no confirmation email actually exists yet, so a token-in-email scheme needs the email service implemented first.

### [INFO] Checked — route-level guards (full inventory)
Every route and its actual guard:

| Method+Path | Guard |
|---|---|
| POST `/admin/auth/login`, `/refresh`, `/reset-password`, `/request-password-reset` | adminAuthRateLimiter (no auth — public by design) |
| POST `/admin/auth/logout` | none |
| GET `/admin/analytics/overview` | `requireAdminAuth` + `requireRole("super_admin","staff")` |
| GET `/admin/customers` | `requireAdminAuth` + `requireRole("super_admin","staff")` |
| GET/POST/PATCH `/coupons` | `requireAdminAuth` + `requireRole("super_admin","staff")` |
| DELETE `/coupons/:id` | `requireAdminAuth` + `requireRole("super_admin")` |
| GET `/orders`, GET `/orders/:id`, PATCH `/orders/:id/status` | `requireAdminAuth` + `requireRole("super_admin","staff")` |
| PATCH `/reviews/:id/status` | `requireAdminAuth` + `requireRole("super_admin","staff")` |
| POST/PATCH `/products` | `requireAdminAuth` + `requireRole("super_admin","staff")` |
| DELETE `/products/:id` | `requireAdminAuth` + `requireRole("super_admin")` |
| POST/PATCH `/brands`, `/categories` | `requireAdminAuth` + `requireRole("super_admin","staff")` |
| DELETE `/brands/:id`, `/categories/:id` | `requireAdminAuth` + `requireRole("super_admin")` |
| GET/POST `GET /maintenance/jobs/:id` | `requireMaintenanceAuth` (router-level `use`) + service-level worker scoping |
| PATCH/DELETE `/maintenance/jobs/:id`, GET `/export` | `requireMaintenanceAuth` + `requireMaintenanceRole("admin")` |
| Public (no guard, by design) | products GET, categories GET, brands GET, search GET, cart CRUD, checkout POST, `orders/:id/confirmation`, `coupons/validate`, reviews POST/GET |

All admin/moderator routes carry the guard in the route definition; none rely on middleware order alone. **Checked, no route is missing its authorization guard.**

---

## 4. Input Validation

### [MEDIUM] `z.coerce.boolean()` — `?inStock=false` behaves as `true`
- **Location:** `src/validators/product.validator.ts:18` — `inStock: z.coerce.boolean().optional()`.
- **Issue:** `z.coerce.boolean()` uses JS `Boolean()` semantics: any non-empty string (including `"false"` and `"0"`) coerces to `true`; only `""` coerces to `false`. So `GET /products?inStock=false` returns **only in-stock** products and `inStock` can never actually be set to false. (The already-fixed `DB_SSL` in `src/config/env.ts:12-15` correctly uses `z.enum(["true","false"])` + transform — **not** affected. This is the only `coerce.boolean` in the codebase.)
- **Impact:** Filter can't be disabled — an incorrect catalog view, plus it quietly inverts stock filtering for API consumers.
- **Fix:** Use `z.enum(["true","false"]).optional().transform(v => v === "true")` (or `z.string().optional().transform(...)`) exactly like `DB_SSL`. Add a regression test asserting `inStock=false`.

### [MEDIUM] Missing upper bounds on array/length inputs → DoS + storage abuse
- **Location:** `src/validators/checkout.validator.ts:9-15` — `items: z.array(...).min(1)` has **no `.max()`** and `quantity` is an unbounded positive int; `:7` `shippingAddress: z.record(z.unknown())` is unbounded; `:4-6` `customerName`/`customerPhone` have no max length. `src/validators/review.validator.ts:8` — `comment: z.string().min(1)` no max. `src/validators/product.validator.ts:27` — `images: z.array(z.string().url())` no `.max()` and no per-string length cap; `:36` `translations: z.array(...).min(1)` no max; `:28` `specifications: z.record(z.unknown())` unbounded. `src/validators/product.validator.ts:13` — `q: z.string().optional()` no max (search caps `q` at 100, `search.validator.ts:5`).
- **Issue:** The global `express.json({ limit: "1mb" })` (`src/app.ts:25`) bounds total payload size, but within that budget a checkout can carry thousands of line items (each triggering a `findById` + `decrementStock` + an `order_items` insert) and a review comment can be ~1 MB of text persisted to `reviews.comment`.
- **Impact:** CPU/DB amplification DoS on `/checkout`; unbounded text persisted for reviews; oversized `images` arrays stored per product.
- **Fix:** Add explicit caps: `items: z.array(...).min(1).max(50)`; `quantity: z.number().int().min(1).max(999)`; `comment: z.string().min(1).max(2000)`; `customerName`/`customerPhone`/`shippingAddress` size caps; `images: z.array(z.string().url().max(500)).max(10)`; `translations: z.array(...).max(20)`; `q: z.string().max(100)`. Consider a smaller JSON limit for non-admin routes.

### [MEDIUM] Product image / logo URLs accept arbitrary schemes
- **Location:** `src/validators/product.validator.ts:27`, `src/validators/brand.validator.ts:12`.
- **Issue:** `z.string().url()` accepts any URI scheme (e.g. `javascript:...`, `file:...`, `data:...`), and any host. The server never fetches these URLs (no SSRF from this backend), but the frontend will render them (e.g. `<img src>` / clickable links), so a stored `javascript:`-scheme or hostile-host image URL is a stored-XSS/UX-vector candidate and can also be used to exfiltrate client-side signals via tracking pixels.
- **Impact:** Low-to-medium depending on frontend rendering; images are admin-controlled, but a compromised/sloppy admin or an imported data set can inject hostile URLs that the public catalog then serves to every visitor.
- **Fix:** Refine to `http:`/`https:` only and (optionally) enforce an allowlisted image host/CDN. If you later accept uploads, validate content-type/magic bytes and store on a separate origin/CDN.

### [INFO] Checked — validation coverage on every input route
All routes that accept `body`/`query`/`params` invoke `validate(...)` (`src/middleware/validate.middleware.ts:10-20`). Verified route-by-route in section 3's inventory; the only routes without a `validate()` call are those that take **no client input**: admin `analytics/overview` (no params), `coupons GET` (no params), and `logout`/`refresh` (refresh reads only the httpOnly cookie). **No route accepting client input is missing a validator.**

---

## 5. Secrets & Configuration

### [CRITICAL] Known default credentials baked into the seed script
- **Location:** `seeds/seed.ts:35` (`bcrypt.hash("Admin12345", ...)` for `admin@iphoneman.test` super_admin) and `:43-55` (`bcrypt.hash("Maintain123", ...)` for `repair.admin@iphoneman.test` admin and `repair.worker@iphoneman.test` worker).
- **Issue:** These are hardcoded, publicly documented passwords (they even appear in `tests/integration/*.test.ts` and `CHANGES-2026-08-05.md`). If `npm run seed` is ever executed against a production database (the script has no guard), a super_admin and a maintenance admin exist with credentials anyone can read from the repo.
- **Impact:** Instant full takeover of the store admin panel and the maintenance panel.
- **Fix:** Never run seeds in production. Change the seed to require random passwords from `process.env` (or generate + print once), and make the production deploy script refuse to run when `NODE_ENV=production` (`seeds/seed.ts:200` calls `void seed()` unconditionally). Immediately audit any environment where the seed has run.

### [MEDIUM] Documented example reset token — known secret if copied (FIXED)
- **Original finding:** `src/docs/examples.ts:306,316` documented a static example reset token (`"reset-token-12345678"`). If an operator copied it into `.env` (the schema only required 8 chars, `src/config/env.ts:23`), it was a known secret.
- **Impact:** Account takeover for any admin/maintenance account on such an environment.
- **Fix applied (2026-08-06):** Reset tokens are now generated per request (DB-backed, single-use, 30-min TTL — see §2 Critical). The OpenAPI request examples were updated to the new `{ resetToken, newPassword }` body shape with a clearly-fake 64-hex placeholder (`src/docs/examples.ts`), and the old static token guidance was removed from the docs.

### [INFO] Checked — no secrets hardcoded in `src/`
- Grep across `src/` for `AKIA`, `sk-`, `BEGIN ... KEY`, `PGPASSWORD`, high-entropy strings, and real JWTs found only a clearly-fake example token (`src/docs/examples.ts:8`, suffix `.example`). No real secrets in source. **No issue found.**

### [INFO] Checked — `.env` not tracked
- `.gitignore:3` excludes `.env`; `git ls-files | grep .env` returns nothing; `git check-ignore .env` confirms it is ignored. **No issue found.**
- **Note:** `CHANGES-2026-08-05.md:89` references a `.env.example` that does **not exist** in the repo. Add one (with placeholder values) so new environments can be provisioned without guessing; keep it secret-free.

### [INFO] Checked — env vars used are all validated
- Cross-referenced every `env.X` / `process.env.X` reference in `src/` against the `envSchema` (`src/config/env.ts:6-26`). All 14 accessed variables are validated (`NODE_ENV`, `PORT`, `DATABASE_URL`, `DB_SSL`, `CORS_ORIGIN`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `MAINTENANCE_JWT_ACCESS_SECRET`, `MAINTENANCE_JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `BCRYPT_ROUNDS`, `COOKIE_DOMAIN`). `z.string().url()` also guarantees `DATABASE_URL` is a URL. **No unvalidated env access found.** Secrets are min-16 validated (`env.ts:17-20`). The former weak 8-char reset-token env var is gone entirely — reset tokens are now DB-backed (§2).

---

## 6. Rate Limiting & Abuse

### [HIGH] `/coupons/validate` is public with no rate limit → coupon enumeration
- **Location:** `src/routes/coupon.routes.ts:12` (no limiter); `src/middleware/rate-limit.middleware.ts:3-22` defines only three limiters (`adminAuth`, `maintenanceAuth`, `checkout`).
- **Issue:** `POST /coupons/validate` is unauthenticated. It returns `200` + the full coupon row (including `usage_limit`, `times_used`, `expires_at` — `src/services/coupon.service.ts:42-45`) vs `404 COUPON_NOT_FOUND`. This is a coupon **code oracle** and also leaks coupon lifecycle metadata (`usage_limit`/`times_used`) to the public.
- **Impact:** Automated enumeration of all valid coupon codes and their remaining capacity; discounts can be harvested and shared; competitor intelligence on campaign usage.
- **Fix:** Add a dedicated public limiter (e.g. 20/15 min per IP, tighter than checkout), and return only `{ valid: boolean, discount }` from the public endpoint — never the raw coupon row.

### [HIGH] `/reviews` create is public with no rate limit → email oracle + spam
- **Location:** `src/routes/review.routes.ts:12`; verification logic `src/services/review.service.ts:8`.
- **Issue:** Unauthenticated and unrate-limited. Since verification is email+product matching (§3), an attacker can (a) brute-force candidate emails against product IDs to confirm past-customer emails and purchase relationships (201 vs 403), and (b) flood fake reviews. There is no per-email dedup either — the same verified email can submit unlimited reviews for the same product.
- **Impact:** Customer PII confirmation/enumeration; review spam that can sway ratings once approved; DB spam.
- **Fix:** Add a review limiter; require a per-checkout one-time review token (see §3 fix); dedup per (email, product); cap comment length (§4).

### [MEDIUM] Rate limiter keying assumes a single direct client IP
- **Location:** `src/middleware/rate-limit.middleware.ts:3-22`; no `app.set("trust proxy", ...)` anywhere in `src/app.ts`/`src/server.ts`.
- **Issue:** `express-rate-limit`'s default key generator uses `req.ip`. Behind a reverse proxy / load balancer (the normal production setup), every request appears to come from the proxy's IP, so **all users share one bucket** — either the entire API gets locked out together (self-inflicted DoS) or, if the proxy IP is spoofable, the limiter is trivially bypassed. Limiters also use the default in-memory store (reset on restart; no shared state across multiple instances).
- **Impact:** Rate limiting may be ineffective or counterproductive in production.
- **Fix:** Set `app.set("trust proxy", 1)` (or the correct hop count) so `X-Forwarded-For` is honored, and use a shared store (Redis) if running multiple instances. Verify per-IP behavior in the deployment.

### [INFO] Checked — auth/checkout limiters present
- Admin login, admin refresh, admin reset-password + request-password-reset (`src/routes/admin-auth.routes.ts:10-14`), maintenance equivalents (`maintenance-auth.routes.ts:10-14`), and checkout (`checkout.routes.ts:10`) all carry the `*RateLimiter` middleware. `logout` has none, which is acceptable (idempotent, no sensitive operation).

---

## 7. HTTP Security Headers & CORS

### [MEDIUM] CSP downgraded with `'unsafe-inline'` script-src globally
- **Location:** `src/app.ts:13-23`.
- **Issue:** `helmet()` is used with defaults except CSP, where `script-src: ["'self'", "'unsafe-inline'"]` is set unconditionally — including in production. Combined with stored attacker-controllable strings (product/brand names, descriptions, and image URLs — see §4/§10), `'unsafe-inline'` for scripts removes CSP's primary defense against injected inline handlers. (Helmet's default CSP does not include `unsafe-inline`; it was loosened — presumably for Swagger UI, which is only served in non-production.)
- **Impact:** If any stored XSS reaches an HTML-rendered page, CSP will not block inline script execution.
- **Fix:** Apply the permissive CSP only when serving Swagger (`NODE_ENV !== "production"`), and keep the strict helmet default in production. Alternatively serve the docs from a separate origin.
- **Checked, otherwise fine:** all other helmet protections are defaults-on (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, etc.).

### [INFO] Checked — CORS is not wildcard
- **Location:** `src/app.ts:24` — `cors({ origin: env.CORS_ORIGIN, credentials: true })`; `.env` has `CORS_ORIGIN=http://localhost:5173` (a concrete origin, no wildcard).
- **Issue:** `credentials: true` is **never** paired with `*` (the current config uses a fixed origin), so the invalid/dangerous wildcard+credentials combination is not present. **No issue found.**
- **Note:** `CORS_ORIGIN` is a single string; if the app will serve multiple frontends (staging/domain variants), switch to an array/function and keep credentials true only with explicit origins.

---

## 8. Error Handling & Information Disclosure

### [MEDIUM] Unexpected JWT failures surface as 500 (see also §2)
- **Location:** `src/services/admin-auth.service.ts:38`, `src/services/maintenance-auth.service.ts:42`.
- **Issue:** `jwt.verify` errors are uncaught → generic 500. Not an information leak (message is `"Something went wrong."`, `error.middleware.ts:37-44`), but a wrong status code on an attacker-triggerable path that also logs noise.
- **Fix:** Map to `ApiError(401)` as described in §2.

### [INFO] Checked — centralized error handler does not leak internals
- **Location:** `src/middleware/error.middleware.ts:6-45`.
- **Issue:** Only three branches: `ZodError` → 400 with `error.flatten()` details; `ApiError` → its code/message/details; everything else → generic 500. No stack traces, SQL text, or file paths are ever sent to the client **in any NODE_ENV**. Raw errors are logged to the server console only (`console.error(error)`, skipped in test). `ApiError.details` is only ever populated by the Zod path (no `new ApiError(..., details)` call with a 4th arg exists anywhere in `src/`). **No issue found.**
- **Note:** `error.flatten()` for body-validation failures can include the field values that failed validation (e.g. a submitted email) echoed back — this only echoes what the client itself sent, so it is not a cross-user disclosure.

### [INFO] Checked — no catch blocks bypass the handler
- All controllers delegate to services and are wrapped in `asyncHandler` (`src/utils/async-handler.ts:3-9`), which forwards rejections to the error middleware. A grep of every `catch` block in `src/` found only `withTransaction` rollback logic (`src/config/db.ts:26-31`) and the seed script (`seeds/seed.ts:191-193`), both of which rethrow. **No raw-error-to-response paths found.**

---

## 9. Dependency Security

### npm audit output (2026-08-06, `npm audit --json`, truncated to relevant fields)

```
metadata.vulnerabilities:
  info: 0, low: 0, moderate: 5, high: 4, critical: 2, total: 11
dependencies: prod 254 / dev 287 / optional 77 / total 541

vulnerabilities:
  tar                       critical  (via @mapbox/node-pre-gyp ← bcrypt)   <=7.5.20
  vitest                    critical  (direct dev) GHSA-5xrq-8626-4rwp      <=3.2.5
  glob                      high      (via node-pg-migrate, dev)           11.0.0–11.0.3
  node-pg-migrate           high      (direct dev, via glob)               7.7.0-rc.0–8.0.3
  @mapbox/node-pre-gyp      high      (via tar)                             <=1.0.11
  vite                      high      (dev, via vitest) GHSA-fx2h-pf6j-xcff <=6.4.2
  exceljs                   moderate  (direct prod, via uuid)               >=3.5.0
  uuid                      moderate  (<11.1.1)  GHSA-w5hq-g745-h8pq
  @vitest/mocker, vite-node, esbuild, vite (moderate)  (dev toolchain)
```

### [CRITICAL] `vitest` (dev dependency) — arbitrary file read/execute (CVSS 9.8)
- **Location:** `package.json:59` (`vitest ^2.1.8`); advisory GHSA-5xrq-8626-4rwp, affects `<3.2.6`, fixed in `4.1.10`.
- **Reachability:** Dev-only (test runner; never in `dependencies`, never loaded by `dist/`). Exploitable only when the Vitest UI server is running in dev.
- **Fix:** Upgrade `vitest` (and its transitive `vite`, `vite-node`, `esbuild`) to a fixed release; it is a semver-major bump, so expect minor test-config churn. This also clears the 4 high + 3 moderate dev-toolchain advisories.

### [CRITICAL] `tar` (transitive via `bcrypt` → `@mapbox/node-pre-gyp`) — path traversal / DoS chain
- **Location:** `package.json:28` (`bcrypt ^5.1.1`) → `@mapbox/node-pre-gyp` (≤1.0.11) → `tar` (≤7.5.20). Advisories include GHSA-34x7-hfp2-rc4v, GHSA-23hp-3jrh-7fpw (critical DoS), and ~10 high/mod path-traversal/DoS entries.
- **Reachability:** `node-pre-gyp` invokes `tar` only at **install time** (downloading the prebuilt binary). Runtime `bcrypt.compare`/`bcrypt.hash` never touch tar. Not remotely reachable through this app's API; the risk is supply-chain (a compromised/malicious npm registry or install-time attack on the build machine).
- **Fix:** `npm audit` reports a fix available (upgrade path exists). Upgrade `bcrypt` to the newest 5.x/6.x that ships a patched `node-pre-gyp`/`tar`, or add an npm `overrides` pinning `tar@>=7.5.20` (verify binary install still works). Add `npm audit` to CI.

### [HIGH] `node-pg-migrate` / `glob` (dev deps) — command injection advisory
- **Location:** `package.json:54` (`node-pg-migrate ^7.9.1`); GHSA-5j98-mcp5-4vw2 affects `glob` 11.0.0–11.0.3.
- **Reachability:** Migrations run by operators locally/CI only. The vulnerable `glob` CLI `-c/--cmd` shell execution is not exercised by this app's usage (plain SQL migrations, `package.json:14-16`).
- **Fix:** Upgrade `node-pg-migrate` to `9.0.0` (fixed) — semver-major, verify migration CLI args are unchanged.

### [MODERATE] `exceljs` (direct prod dep) via `uuid` — **keep**
- **Location:** `package.json:32` (`exceljs ^4.4.0`); `exceljs/lib/xlsx/xform/sheet/cf-ext/cf-rule-ext-xform.js:1` is the only place it imports `uuid` (`v4`). Advisory GHSA-w5hq-g745-h8pq affects `uuid` **v3/v5/v6 when a `buf` argument is supplied** — exceljs uses `uuidv4()` with no buffer, so the vulnerable code path is never hit.
- **Reachability:** exceljs is used only for workbook generation on the admin-only export (`src/services/maintenance-job.service.ts:125-179`); no user-supplied file is ever parsed. Combined with the fact that `uuid@v4` is not affected by the advisory, this is **not exploitable** through this app.
- **Note on the prompt's "2 critical + 4 high at install time":** the current audit no longer attributes criticals to exceljs; those earlier figures correspond to the `bcrypt`/`tar` install-time chain (above), not exceljs.
- **Recommendation:** **Keep** exceljs (no better-maintained drop-in with identical API). Belt-and-braces options: add `overrides: { "uuid": "^11.1.1" }` in `package.json` (verify exceljs works), and/or note that if the export feature ever grows "import Excel file" functionality, that usage must be re-reviewed because it would newly reach other exceljs internals.

---

## 10. Data Exposure

### [MEDIUM] Public product review listing leaks reviewer email addresses
- **Location:** `src/models/review.model.ts:15-21` — `SELECT * FROM reviews WHERE product_id = $1 AND status = 'approved'`; `src/controllers/review.controller.ts:11-13` returns the full rows; documented schema includes `reviewer_email` (`src/docs/schemas.ts:138`).
- **Issue:** `GET /reviews?product_id=N` (public) returns every approved reviewer's `reviewer_email` alongside name/comment.
- **Impact:** Publicly exposes customers' email addresses — a direct PII leak that also feeds the email-enumeration abuse in §6.
- **Fix:** Return only `{ reviewer_name, rating, comment, created_at, product_id }` from the public list (omit `reviewer_email`, `id`, `status`, `updated_at`); add a column-projection model method rather than `SELECT *`.

### [MEDIUM] Guest order-confirmation endpoint exposes full shipping PII with guessable IDs
- **Location:** `src/routes/order.routes.ts:13` (public); `src/models/order.model.ts:55-58` returns the full `orders` row via `SELECT *`; schema includes `customer_phone` and `shipping_address` (`src/docs/schemas.ts:109,114`).
- **Issue:** Order IDs are sequential `BIGSERIAL` (migration `001_initial_schema.sql:122`). The only gate is that the `email` query param must match `customer_email`. If an attacker knows (or enumerates) an order ID and can guess the associated email, the full name, phone number, and home shipping address are returned.
- **Impact:** PII disclosure (home address, phone) of customers; compounding with the review-oracle in §6, a low-skill attacker can harvest real order data.
- **Fix:** Return a minimal confirmation payload (status, totals, items) without `customer_phone`/`shipping_address`; use a non-sequential public order reference (UUID) in the confirmation URL; optionally require a per-order confirmation code included in the (future) email.

### [MEDIUM] Public coupon validation leaks coupon metadata
- **Location:** `src/services/coupon.service.ts:42-45` returns the whole coupon row; `src/routes/coupon.routes.ts:12` public.
- **Issue:** `usage_limit`, `times_used`, `expires_at`, `min_order_value` are disclosed to anonymous callers (see §6).
- **Fix:** Return only `{ valid: true, discount, code }` from the public validate endpoint; keep the full row for admin routes.

### [INFO] Checked — no password hashes or auth material in responses
- Login/refresh responses return only `id`, `name`, `email`, `role` + tokens (`src/controllers/admin-auth.controller.ts:23`, `maintenance-auth.controller.ts:23`). No endpoint returns `password_hash` (grep across `src/controllers` confirms). Admin customers view (`src/models/order.model.ts:106-117`) returns email/name/phone/spend — appropriate for an admin report and role-guarded. Maintenance worker listings return only the worker's own jobs with no join to other users' names/emails (`maintenance-job.model.ts:90-93`); the worker-name/email join is confined to the **admin-only** export path (`maintenance-job.service.ts:150-155`, route guard `maintenance-job.routes.ts:20`). Public product responses include `stock_quantity` (inventory detail) — minor, see Low.

---

## 11. File/Upload Security

### [LOW] Arbitrary image URLs with no scheme/host validation
- **Location:** `src/validators/product.validator.ts:27`, `src/validators/brand.validator.ts:12`; stored in `products.images` / `brands.logo_url` and served by public catalog endpoints.
- **Issue:** No endpoint accepts file uploads (there is no `multer`/`busboy`/multipart handling anywhere), so classic upload attacks (shell upload, polyglot, oversized media) are **not present**. The remaining surface is the URL-string fields: only scheme-loose `z.string().url()` validation. The backend never fetches these URLs (no server-side SSRF), but the frontend consuming them can be exposed to stored-XSS/tracking-pixel vectors.
- **Impact:** Low (admin-created content only); would escalate if the frontend renders non-image or `javascript:`-scheme URLs without sanitization.
- **Fix:** Restrict to `http`/`https` + optional host allowlist as in §4. If uploads are added later: separate origin, size/type caps, random filenames, no execution.

---

## 12. Financial Integrity

### [INFO] Checked — order totals are always computed server-side
- **Location:** `src/services/checkout.service.ts:15-41`.
- **Issue:** `unitPrice = Number(product.discount ?? product.price)` is read from the **current DB row** (`:28`), never from client input; `subtotal`, `discount`, `tax`, `total` are all server-computed from DB prices and the validated coupon (`:29, :33-40`). The client-supplied `CheckoutInput` carries only `productId`/`variantId`/`quantity` (`checkout.validator.ts:9-14`); `orderModel.create` writes the server-computed values (`order.model.ts:24-52`). **No client-trusted pricing path exists.** Discount handling uses the DB sale price — correct.
- **Maintenance jobs:** `net_amount` and `net_profit` are recomputed in the service from the submitted cost/customer prices and percentage (`maintenance-job.service.ts:37-38, 96-97`); the validator bounds `percentage` to 0–100 (`maintenance-job.validator.ts:10`) and DB checks keep all money columns ≥ 0 (migration `002:17-21`). Workers enter the raw prices by design; the derived figures are never client-supplied. **No issue found.**
- **Minor note:** the product schema allows `discount` (the sale price) to be any nonnegative value, including `0` (free product) or greater than `price` (`product.validator.ts:33-34`; no DB CHECK for `discount <= price` in `001_initial_schema.sql:67-68`). Admin-only, so low risk, but a `discount = 0` sale price means $0 orders. Consider a `discount < price` refinement and an explicit `price > 0` policy.
- **Race caveat:** the *integrity* of the price math is sound, but the **stock/coupon** enforcement around it is racy — see the two Critical/Medium findings in §3.

---

## Full Finding Index (by severity)

### Critical
1. Static shared reset token for both auth systems — cross-system account takeover (§2). **FIXED 2026-08-06.**
2. Checkout stock TOCTOU race — oversell via concurrent checkouts (§3). **FIXED 2026-08-06.**
3. Known default credentials in `seeds/seed.ts` + vitest/tar dependency criticals (two separate findings: §5, §9). **Seed guard fixed; dependency criticals open.**

### High
4. Refresh tokens never rotated/revoked — 7-day replay (§2). **FIXED 2026-08-06.**
5. `/coupons/validate` public, unrate-limited coupon oracle (§6). **Open.**
6. `/reviews` create public, unrate-limited email oracle + spam (§6). **Open.**

### Medium
7. Invalid refresh token → 500 instead of 401 (§2). **FIXED 2026-08-06.**
8. Coupon usage-limit TOCTOU race (§3). **FIXED 2026-08-06.**
9. Documented example reset token — known secret if copied (§2). **FIXED 2026-08-06.**
10. Review verification spoofable (§3).
11. `inStock: z.coerce.boolean()` bug (§4).
12. Missing array/length upper bounds → DoS/storage abuse (§4).
13. Arbitrary image-URL schemes (§4/§11).
14. CSP `'unsafe-inline'` in production (§7).
15. Public reviews leak `reviewer_email` (§10).
16. Guest confirmation endpoint exposes shipping PII with sequential IDs (§10).
17. Coupon validate leaks coupon metadata (§10).

### Low
18. Admin/maintenance JWT cross-usage depends on secret distinctness (§2).
19. Docs publish an example reset token (§5). **FIXED 2026-08-06.**
20. Rate-limiter IP keying without `trust proxy` (§6).
21. Public product listings expose `stock_quantity` (§10).
22. Product `discount` (sale price) can be `0`/`> price` (§12).

### Informational
- SQL injection: **checked, no issue found** (§1).
- Role forgery: **checked, no issue found** (§2).
- Maintenance worker IDOR: **checked, no issue found** (§3).
- Route guards: **checked, no issue found** (§3).
- Validation coverage: **checked, no issue found** (§4).
- Secrets in `src/`: **checked, no issue found** (§5).
- `.env` not tracked / gitignored: **checked, no issue found** (§5).
- Env var validation completeness: **checked, no issue found** (§5).
- Error handler / catch blocks: **checked, no issue found** (§8).
- Financial computation integrity: **checked, no issue found** (§12).

---

## Fix These First (top 5)

1. **(DONE 2026-08-06)** Replaced the static shared reset token with per-request, single-use, time-limited reset tokens stored in DB, **one store per system** (§2 Critical). Migration `003_reset_tokens.sql` added the two tables; `POST /{admin,maintenance}/auth/request-password-reset` issues a random 64-hex token (30-min TTL, sha256-hashed at rest) and `/reset-password` consumes it once. The old env var was removed from `env.ts`, `.env`, and all docs.

2. **(DONE 2026-08-06)** Fixed the checkout stock race: stock check + decrement are now atomic inside the transaction and the order fails when the conditional `UPDATE` matches 0 rows (§3 Critical). Same treatment for variant stock, and the coupon `incrementUsage` is now conditional with a `rowCount` check so the usage cap is enforced atomically (§3 Medium).

3. **(DONE 2026-08-06)** Implemented real refresh-token rotation with server-side revocation — DB-backed tokens (migration `004_refresh_tokens.sql`), delete-on-refresh, family revocation on reuse — and mapped JWT verification failures to 401 instead of 500 (§2).

4. **Guard the public abuse surface: add rate limiters to `/coupons/validate` and `/reviews`, trim the public coupon/review responses (no `times_used`/`reviewer_email`), and add a per-checkout review token** (§6, §10). This closes coupon enumeration, customer-email verification, and the reviewer-email PII leak.

5. **Fix `inStock` boolean coercion and add upper bounds on arrays/lengths** (checkout items/quantity, review comment, images, translations, `q`) (§4), then run `npm audit fix` / targeted upgrades for `vitest` (→4.1.10), `bcrypt`/`tar` overrides, and `node-pg-migrate` (→9.0.0) (§9), and harden the seed script so default credentials can never be applied to production (§5).
