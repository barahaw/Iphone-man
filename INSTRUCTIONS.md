# INSTRUCTIONS.md

## iPhone Man — Premium Mobile & Accessories E-Commerce Platform

**Document Type:** Product & Engineering Specification (Single Source of Truth)
**Audience:** AI coding agents and human engineers working in this repository
**Status:** v2.1 — rewritten to match the code that actually exists

---

## 1. Project Overview

The monorepo root contains two working applications plus documentation:

| Directory    | What it is                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| `Frontend/`  | **Storefront + demo admin** — Vite + React 19 SPA (client-side).           |
| `backend/`   | **REST API** — Express 5 (TypeScript) + PostgreSQL, strict MVCS layout.    |
| `INSTRUCTIONS.md` | This document — the authoritative spec.                              |

### 1.1 The Frontend (`Frontend/`)

A trilingual (en/ar/he) single-page storefront with full RTL support. Features:
home, catalog (browse/search/filter/sort/paginate), slug-based product detail
pages with color/storage variants and spec tables, cart drawer with coupons, a
3-step guest checkout, wishlist, product comparison, product reviews (demo),
a "recently viewed" rail, about/contact pages, and a demo admin dashboard
(login → KPIs → add product → settings).

The storefront is **backend-first with an offline fallback**: product listing
and detail fetches hit the real API at `/api/v1` (§7). When the API is
unreachable, `productsApi.js` transparently falls back to a built-in catalog so
the store remains fully usable standalone (demo mode).

### 1.2 The Backend (`backend/`)

A real Express + PostgreSQL REST API implementing the storefront endpoints
(products, categories, brands, cart, checkout, orders, coupons, reviews,
search), the admin API, and the **independent Maintenance Service Module**
(§39). It follows the mandatory MVCS pattern (§17.1), uses Zod validators,
rotation-safe refresh tokens, and Swagger/OpenAPI docs.

**Scope note — no customer accounts:** there is no customer registration,
login, or account system in v1. Every customer interacts anonymously: browsing,
local cart/wishlist, and a guest checkout (name, email, address, payment info at
checkout time). There is no order-tracking or order-history page — the
on-screen/email confirmation is the customer's only record. Product reviews are
verified against the order email, not a login. The only accounts are staff
(`admin_users`) and maintenance staff (`maintenance_users`).

---

## 2. Tech Stack & Tooling

### Frontend

| Concern        | Choice                                                              |
| -------------- | ------------------------------------------------------------------- |
| Build tool     | Vite 8 (`@rolldown` + `@vitejs/plugin-react`)                        |
| UI framework   | React 19 (StrictMode), functional components, hooks only            |
| Language       | JavaScript (ESM, `.jsx`) — **not** TypeScript                       |
| Routing        | `react-router-dom` v7 (`BrowserRouter`)                            |
| Server state   | `@tanstack/react-query` v5 (5 min `staleTime`, no refetch on focus) |
| Client state   | Zustand v5 (+ `zustand/middleware/persist` for localStorage)       |
| Styling        | Tailwind CSS v4 (`@tailwindcss/vite`), tokens in `src/styles/theme.css` |
| Icons          | `lucide-react`                                                      |
| Class utils    | `clsx` + `tailwind-merge`; Babel + `babel-plugin-react-compiler`    |
| Linting        | ESLint 10 with react-hooks + react-refresh (+ `set-state-in-effect`) |

### Backend

| Concern        | Choice                                                              |
| -------------- | ------------------------------------------------------------------- |
| Runtime        | Node + Express 5 (TypeScript 5, ESM, `tsx` for dev)                |
| Database       | PostgreSQL via `pg` (raw SQL — no ORM)                              |
| Migrations     | `node-pg-migrate` (SQL files in `backend/migrations/`)              |
| Validation     | Zod schemas per resource (`src/validators/`)                        |
| Auth           | Access + refresh JWT (rotation / reuse-detection), bcrypt hashing   |
| Docs           | Swagger UI at `/api-docs` (dev), OpenAPI 3.0 generated from schemas |
| Rate limiting  | `express-rate-limit` on auth/checkout                               |
| Tests          | Vitest + Supertest (`backend/tests/`)                                |
| Linting        | ESLint 9 + `typescript-eslint`                                       |

---

## 3. Getting Started

### Frontend

```bash
cd Frontend
npm install
npm run dev       # dev server (default http://localhost:5173)
npm run build     # production build — must pass
npm run lint      # ESLint — must pass (zero errors)
npm run preview   # preview the production build
```

### Backend

```bash
cd backend
cp .env.example .env   # if no .env exists (see §34)
npm install
npm run migrate:up     # apply migrations/ (001–006)
npm run seed           # seed admin / maintenance users + sample data
npm run dev            # API with hot reload (port from .env)
```

Verification before finishing **any** change:

1. `npm run lint` and `npm run build` pass in the affected package.
2. If locale files changed: `en/ar/he.json` must stay key-identical (§36.4).
3. Backend changes: `npm test` still green; migrations go through
   `node-pg-migrate` if the schema moves (§16–§17, §34).

---

## 4. Repository Layout

```
iphone-man/
├── INSTRUCTIONS.md          # this file — the source of truth
├── Frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js       # React + Tailwind v4 plugins (dev proxy /api/v1 → :3000 — §7)
│   ├── eslint.config.js
│   ├── public/
│   │   ├── logo.jpg  favicon.svg  placeholder-product.svg
│   └── src/
│       ├── main.jsx         # QueryClientProvider + <App/>
│       ├── index.css        # imports theme.css + keyframes + reduced-motion
│       ├── App.jsx          # routes, lazy loading, <html lang/dir/.dark>
│       ├── styles/theme.css # design system: @theme tokens + component classes
│       ├── locales/{en,ar,he}.json
│       ├── shared/
│       │   ├── api/productsApi.js      # backend-first + fallback catalog
│       │   ├── i18n/useTranslation.js  # t(path,fallback), EN fallback (§36.2)
│       │   ├── stores/    # useUiStore, useCartStore, useWishlistStore,
│       │   │               # useCompareStore, useFilterStore, useCheckoutStore,
│       │   │               # useRecentlyViewedStore, useToastStore
│       │   ├── components/ StoreHeader, Footer, FloatingChat, Toast
│       │   │   └── ui/    Button, Input, Drawer, CompareTray, SurfaceCard, Reveal
│       │   └── layouts/   StoreLayout, AdminLayout
│       └── features/
│           ├── home/      components/HomePage.jsx
│           ├── products/  PLP, PDP, ProductGrid, ProductCard, FilterSidebar,
│           │               SortDropdown, Pagination, MobileFilterDrawer,
│           │               ProductToolbar, ProductSpecTable, ReviewSection,
│           │               RecentlyViewedSection, ComparePage
│           ├── cart/         components/CartDrawer.jsx
│           ├── checkout/     components/CheckoutWizard.jsx
│           ├── wishlist/     components/WishlistPage.jsx
│           ├── info/         AboutPage, ContactPage
│           └── admin/        AdminLogin, AdminNavButton, AdminDashboard,
│                              AddProduct, AdminSettings
└── backend/
    ├── package.json  tsconfig.json  eslint.config.js  openapi.json
    ├── .env.example/gitignore
    ├── migrations/  001_initial_schema.sql … 006_drop_payments.sql
    ├── seeds/       seed.ts
    ├── tests/       unit + integration
    └── src/
        ├── app.ts  server.ts
        ├── config/        env.ts, db.ts
        ├── routes/        product, category, brand, cart, checkout, order,
        │                  coupon, review, search, admin, admin-auth,
        │                  maintenance-job, maintenance-auth
        ├── controllers/   same surface as routes
        ├── services/      business logic (+ analytics, email, search)
        ├── models/        raw SQL per table
        ├── middleware/    admin-auth, maintenance-auth, maintenance-rbac,
        │                  rbac, rate-limit, validate, error
        ├── validators/    Zod schemas per resource
        ├── docs/          OpenAPI 3.0 generation
        ├── types/         express.d.ts
        └── utils/         api-error, api-response, async-handler, jwt,
                           pagination, reset-token
```

Rules:

- `Frontend/src` imports never leave `src/`. `features/*` may import
  `shared/*` and `ui/*`, but not sibling features.
- Backend layers must follow MVCS strictly (§17.1) — a controller may never run
  SQL, a route may never contain business logic.
- `node_modules/`, `dist/`, `.env`, and `*.log` are gitignored in both packages.

---

## 5. Frontend Architecture & State Tiers

State belongs to exactly one of three tiers. Before adding state, ask "where
does this data come from and who else needs it?"

| Tier | Library | Owns | Lifetime / rule |
| --- | --- | --- | --- |
| Remote state | TanStack Query | Anything that comes from an API: product lists, product detail, related items. | Cached + revalidated by query key. Never copy into a Zustand store. |
| Global UI state | Zustand | Client-only state shared across components: cart, wishlist, compare, recently viewed, filters, checkout wizard, toasts, locale/theme/modals. | One small store per domain (§6). `persist` only when it must survive a refresh. |
| Local state | `useState` | Scoped to one component: variant picker, live search text, form fields before submit. | Dies on unmount. |

**Forbidden:** storing fetched data in Zustand; Context-as-a-global-store;
promoting local state to a global store "just in case"; `setState()` called
synchronously inside an effect (ESLint error) — prefer keyed remounts.

## 6. Frontend State Stores Reference

All in `src/shared/stores/`.

| Store | Persist key | Notes |
| --- | --- | --- |
| `useUiStore` | `iphone-man-ui-settings` | `locale:'ar'`, `dir:'rtl'`, `theme:'light'`; cart/wishlist/search modal flags. `partialize` persists only locale/dir/theme. `setLocale`/`setTheme` also update `<html dir/lang/.dark>`. |
| `useCartStore` | `iphone-man-cart` | Items with variant + qty; `applyCoupon`/`removeCoupon`; totals. Starts empty (`items: []`). |
| `useWishlistStore` | `iphone-man-wishlist` | Seeded with 1 demo item. |
| `useRecentlyViewedStore` | `iphone-man-recently-viewed` | Max 10, most-recent-first. |
| `useCompareStore` | (memory) | Max 4 items. |
| `useFilterStore` | (memory) | category, brands, price range, in-stock, query, sort, page; has `setCategories` for `?category=` hydration. |
| `useCheckoutStore` | (memory) | step, shipping fields, paymentMethod, orderResult. |
| `useToastStore` | (memory) | success/info/error; rendered by `<ToastContainer/>`. |

## 7. Data Layer & Backend Integration

`src/shared/api/productsApi.js` is the single product source in the frontend.

- `fetchProducts(params)` → `GET /api/v1/products` (React Query key `'products'`).
- `fetchProductBySlug(slug)` → `GET /api/v1/products/:slug` (key `['product', slug]`);
  returns the enriched product from the API, or the local `enrichProduct(slug)`
  when the API returns nothing.
- **Fallback behavior:** both fetchers `catch`/check failures and fall back to a
  built-in `FALLBACK_PRODUCTS` catalog (9 devices incl. `iphone-17-pro`) plus
  `PRODUCT_DETAILS` (colors, storage deltas, specs, gallery, related). This is
  what lets the store run with no backend at all.
- `enrichProduct(slug)` joins the catalog record with `PRODUCT_DETAILS`,
  `buildImages`, wallet-friendly `DEFAULT_WARRANTY`/`DEFAULT_DELIVERY`, and
  `getRelatedProducts`.

**Integration status:** `vite.config.js` **already defines a dev proxy** for
`/api/v1` → `http://localhost:3000` (the backend `PORT`). In dev, `/api/v1/*`
requests are forwarded to the backend through that proxy. In production, serve
the built frontend from a host whose `CORS_ORIGIN` the backend allows. The
offline fallback keeps the store usable when the API is unreachable either way.

Product identity convention: `slug` for URLs, `id` for React keys / cart /
wishlist / compare. Home page `LATEST_PRODUCTS` must reuse exact catalog ids
(e.g. iPhone 17 Pro is `p17`), never a duplicate.

---

## 8. Frontend Routing Map

Defined in `src/App.jsx`.

| Route | Component | Lazy? | Layout | Notes |
| --- | --- | --- | --- | --- |
| `/` | HomePage | No | StoreLayout | |
| `/products` | PLP | No | StoreLayout | reads `?category=` & `?q=` |
| `/product/:slug` | PDP | No | StoreLayout | slug-based |
| `/about`, `/contact` | AboutPage/ContactPage | No | StoreLayout | |
| `/compare` | ComparePage | **Yes** | StoreLayout | |
| `/wishlist` | WishlistPage | No | StoreLayout | |
| `/checkout` | CheckoutWizard | **Yes** | StoreLayout | |
| `/admin/login` | AdminLogin | **Yes** | standalone | |
| `/admin` | AdminDashboard | **Yes** | AdminLayout | auth guard |
| `/admin/add` | AddProduct | **Yes** | AdminLayout | auth guard |
| `/admin/settings` | AdminSettings | **Yes** | AdminLayout | auth guard |

Rules:

- Lazy routes render inside `<Suspense fallback={<PageFallback/>}>` (spinner,
  `aria-busy`). Keep admin + checkout lazy so the storefront bundle stays lean.
- `App.jsx` syncs `document.documentElement` `lang`, `dir`, `.dark` from
  `useUiStore`.
- There is **no** `/admin/inventory` route; do not link to it.

---

## 9. Feature Map

Verify every feature in **all three locales and both directions** before calling
it complete — RTL bugs are functional bugs (§36.3).

1. Home / catalog / product detail → §10–§12
2. Cart, coupons, checkout → §13–§14
3. Wishlist & compare → §15
4. Product reviews & recently viewed → §18
5. Frontend admin demo → §19
6. Backend API + DB + maintenance → §16–§17, §39

## 10. Storefront — Home (`HomePage`)

Hero, category tiles (`smartphones` / `accessories` / `watches` → links to
`/products?category=<key>`), latest products, "Why iPhone Man?", newsletter,
floating WhatsApp bubble (`FloatingChat`). Keep `LATEST_PRODUCTS` ids/slugs in
sync with the catalog (§7).

## 11. Storefront — Catalog (`PLP`)

- `/products?category=…` hydrates `useFilterStore` via `setCategories`;
  `?category=all` **resets** the category filter (used by the footer nav).
- `?q=` seeds the search query; sort + filter + in-stock + pagination (8/page).
- Layout: `ProductToolbar` → `FilterSidebar` (desktop) /
  `MobileFilterDrawer` (<`lg`) → `ProductGrid` → `Pagination`.
- The only categories are `smartphones`, `accessories`, `watches`.

## 12. Storefront — Product Detail (`PDP`)

- `/product/:slug` → `useQuery(['product', slug])`. Loading = skeleton
  (`aria-busy`); unknown slug = localized NotFound with CTA.
- Selection state (image, color, storage, quantity) lives in a keyed child —
  `<PdpContent key={slug} product={product}/>` — so it resets on product change
  *without* `setState` in an effect (banned by `react-hooks/set-state-in-effect`).
- Price = `product.price + storage.delta`; add-to-cart builds
  `variant = "<storage.label> / <color.nameEn>"`.
- Sets `document.title` to `<name> — iPhone Man` and restores the default on
  unmount.
- Specs (`ProductSpecTable`), reviews (`ReviewSection`), related products, and
  a **sticky mobile "Add to Cart" bar** (§21).

## 13. Storefront — Cart & Coupons (`CartDrawer`)

- Slide-in `Drawer` (focus trap + Escape, §22), quantity steppers, remove,
  subtotal / discount / free shipping / total with `<bdi>` prices.
- Coupons are **hardcoded** in `handleApplyCoupon`: `SAVE10` = 10% off,
  `FREE20` = 20 ₪ off. Invalid code → localized `common.invalidCoupon`
  (keep the "Try SAVE10" hint). Applied banner → `common.couponApplied` with
  `{code}` replace.
- **Temporarily disabled:** the coupon input + Apply button in `CartDrawer` are
  `disabled` and the input shows the `common.couponsSoon` hint. The
  `applyCoupon`/`removeCoupon` logic and the `appliedCoupon` field stay intact
  for future wiring to `POST /api/v1/coupons/validate`; nothing is sent to the
  API until then.

## 14. Storefront — Checkout (`CheckoutWizard`)

Guest-only, 3 steps (Shipping → Payment → Confirmation), progress stepper,
inline per-field errors (`checkout.requiredField`). Payment is **COD only**:
`useCheckoutStore.paymentMethod` defaults to `'cod'`, and only the COD option is
rendered on step 2 (the `card` / `apple_pay` methods and their locale keys are
kept in code/locales for later, just not shown). `handlePlaceOrder` calls the
real backend `POST /api/v1/checkout` (§17) with the guest payload
(`customerName`, `customerEmail`, `customerPhone`, `shippingAddress`) and
`items: [{ productId, quantity }]` from the cart, sending **no couponCode** this
phase. On HTTP 201 it commits the returned `id` / `total` via
`completeCheckout`, clears the cart, and shows the success toast. Failures are
mapped from the backend `ApiError` code: `404 PRODUCT_NOT_FOUND` and
`409 INSUFFICIENT_STOCK` produce specific toasts; anything else (network / 5xx /
validation) gets a generic toast — the cart is never cleared and the wizard stays
on step 2. The submit button disables with a spinner + `checkout.placeOrderSubmitting`
to prevent double submits. Step 3 shows the real order number, total, and a
contact line (`checkout.contactLine`) with the store WhatsApp number
`+970 123 346 789` (matches `FloatingChat`) for the team to confirm the order and
arrange cash on delivery.

## 15. Storefront — Wishlist & Compare

Wishlist: local + persisted; badge count in header; move-to-cart and clear.
Compare: `CompareTray` (fixed bottom bar, ≥1 item, max 4) → `/compare` page with
side-by-side spec table + "highlight differences"; remove buttons use
`common.removeFromCompareItem` with `{name}` replace.

## 16. Backend — Database Schema

**Table of contents note:** the numbering in this file is stable so that the
`backend/README.md` references to "Sections 16-17" and code comments citing
§21/§36.2 keep pointing at the right places.

**Engine:** PostgreSQL. Raw SQL via `pg` (no ORM). Migrations are numbered SQL
files in `backend/migrations/` (`001_initial_schema.sql` → `006`). All timestamps
are `TIMESTAMPTZ`. Enums: `admin_role`, `order_status`, `review_status`,
`discount_type`, `locale_code`, `maintenance_role`.

**Single-vendor + no-customer-accounts model:**

- No `vendors`/`sellers` table and no `user_id` on anything customer-facing.
- Customer identity lives on the `orders` row itself (`customer_name`,
  `customer_email`, `customer_phone`, `shipping_address`).
- Wishlist / recently-viewed / cart live in the browser (localStorage / guest
  session) — `carts` + `cart_items` only exist server-side to hold a guest
  session mid-checkout. There is **no `wishlists`, `customers`, or `users`
  table** for shoppers.
- The only accounts are `admin_users` (super_admin | staff) and
  `maintenance_users` (admin | worker).

**Core tables (from `001`):**

| Table | Notes |
| --- | --- |
| `admin_users` | name, email (unique), password_hash, role (`super_admin`/`staff`) |
| `brands` + `brand_translations` | translations keyed by `locale_code` (en/ar/he) |
| `categories` + `category_translations` | `parent_id` for subcategories, `display_order` |
| `products` + `product_translations` | images `TEXT[]`, specifications/compatible_devices JSON/array, stock, price, discount, rating, is_active |
| `product_variants` | variant_name/value, `price_delta`, stock |
| `reviews` | reviewer name/email, rating 1–5, comment, `status` (pending/approved/rejected) — verified against `orders.customer_email` |
| `carts` / `cart_items` | guest session cart (`session_id` unique) |
| `orders` / `order_items` | financial rows; `order_items` RESTRICT on delete |
| `coupons` | code, discount_type (`percentage`/`fixed`), value, min order, expiry, usage limits |

> The `payments` table and `payment_status` enum defined in migration 001 were
> removed in migration 006 — a deep audit confirmed zero references anywhere in
> application code (models, services, controllers, routes, validators, tests,
> docs, openapi.json). Payment state is tracked entirely via `orders.status`.
> Payments integration is deferred to §32.7 if/when a PCI-compliant provider is
> wired in; that work would recreate this table via a new migration.

**Auth/aux tables (from `003`–`005`):**

- `admin_password_reset_tokens` / `maintenance_password_reset_tokens` —
  single-use reset tokens stored as sha256 hashes (`used_at` marks consumption).
- `admin_refresh_tokens` / `maintenance_refresh_tokens` — refresh-token
  rotation with `revoked_at`; a reused token revokes all of that user's sessions.
- `005` adds `orders.coupon_code` FK pointing at `coupons(code)` (SET NULL).

**Maintenance tables (from `002`):** see §39.

**Indexes:** `products.slug/category_id/brand_id`, `orders.customer_email`,
`reviews.product_id`, translation tables on `locale`,
`maintenance_jobs.worker_id/created_at`.

**Seed** (`seeds/seed.ts`) creates: admin `admin@iphoneman.test` /
`Admin12345` (super_admin); maintenance `repair.admin@iphoneman.test` and
`repair.worker@iphoneman.test` (both `Maintain123`); plus sample products,
categories, brands, reviews, coupons, and repair jobs.

---

## 17. Backend — API Surface

All routes mount under `/api/v1` (see `src/routes/index.ts`).

```
Storefront
GET  /api/v1/products            (paged, `?page=&limit=`, filters)
GET  /api/v1/products/:slug
GET  /api/v1/categories
GET  /api/v1/brands
GET  /api/v1/search?q=
POST /api/v1/cart                + GET/PATCH/DELETE on /cart and /cart/:id/items
POST /api/v1/checkout            (guest — creates order, applies coupon, decrements stock)
GET  /api/v1/orders/:id/confirmation   (public, order id + email match)
POST /api/v1/reviews             (public — validated against orders.customer_email)
GET  /api/v1/reviews?product_id=
POST /api/v1/coupons/validate
Admin
POST /api/v1/admin/auth/login|logout|refresh|request-password-reset|reset-password
GET  /api/v1/admin/analytics/overview
GET  /api/v1/admin/orders|products|categories|brands|reviews|customers  (+CRUD)
Maintenance (independent module, §39)
POST /api/v1/maintenance/auth/*    login|logout|refresh|request-password-reset|reset-password
GET  /api/v1/maintenance/jobs               (worker: own; admin: all, ?month=YYYY-MM)
POST /api/v1/maintenance/jobs
GET  /api/v1/maintenance/jobs/:id
PATCH|DELETE /api/v1/maintenance/jobs/:id   (admin)
GET  /api/v1/maintenance/jobs/export?month=YYYY-MM  (admin — .xlsx)
```

Conventions:

- Response envelope `{ data, error, meta }` (`src/utils/api-response.ts`);
  pagination via `?page=&limit=` with `meta.total`/`meta.hasMore`.
- Errors are `ApiError` with consistent status codes ([`src/utils/api-error.ts`]).
- Input validation everywhere via Zod (`src/validators/*`, used by
  `validate.middleware`); RBAC server-side on every admin/maintenance route.
- `/health` returns `{ data: { ok: true } }`. `/api-docs` (Swagger UI) and
  `/api-docs.json` are served in non-production.

### 17.1 Backend Architecture: MVCS Pattern (mandatory)

Routes → Controllers → Services → Models. No layer may skip another: a
controller must never query the database; services are framework-agnostic (no
`req`/`res`); models own raw SQL for a single table.

| Layer | Responsibility | May call |
| --- | --- | --- |
| Routes | HTTP method + path, middleware, forwards to controller | Controller |
| Controller | Parses request, calls service, shapes `{data,error,meta}` response, `next(err)` | Service |
| Service | Business logic, transactions, side effects (emails, stock, coupon math) | Models, other services, external APIs |
| Model | Raw SQL for one entity/table | Database only |

Every new backend feature must be scaffolded across all four layers plus a
Zod validator and (for protected routes) the right auth/RBAC middleware.

---

## 18. Storefront — Reviews & Recently Viewed

`ReviewSection`: 5-star rating input, name + order email, comment —
submissions are **local/demo** (displayed + success toast, not persisted). The
verified badge uses `pdp.verifiedBuyer`; star widgets ship translated aria
labels; `ReviewCard` formats dates per active locale. `RecentlyViewedSection`
renders up to 10 items from `useRecentlyViewedStore` and falls back to
`placeholder-product.svg` when an item has no image.

## 19. Frontend Admin (Demo)

- **Demo auth only:** `AdminLogin` pre-fills `admin@iphoneman.com` /
  `password123`; on submit writes `localStorage.adminToken =
  "jwt_mock_token_super_admin"` and navigates to `/admin`; a present token
  redirects straight there.
- `AdminLayout` guards all `/admin/*` routes (no token → `/admin/login`);
  sidebar labels from `nav.*`/`admin.*` keys; logout clears the token.
- Screens: `AdminDashboard` (KPI cards; top-categories list uses
  `nav.accessories` **not** `nav.cases` — that key is gone), `AddProduct`
  (full demo form, writes nothing), `AdminSettings` (demo form).
- This demo is the UI stepping stone for the real backend admin API (§17); data
  is **not** persisted in the frontend.

---

## 20. Frontend Coding Standards & Design System

The single source of truth for how frontend code is written and styled.

### 20.1 Coding Standards

- JavaScript (ESM), functional components, one component per file.
- Named exports (`export function X`); matching default export allowed.
- `kebab-case` filenames except components (`PascalCase.jsx`).
- ESLint is strict: `react-hooks` rules on — including
  `react-hooks/set-state-in-effect` (do not `setState` synchronously in an
  effect; use keyed remounts or event handlers).
- Comments carry intent only (e.g. `/* INSTRUCTIONS.md §21 */`); no decorative
  banners.
- Never hardcode UI copy — use `t()` with locale keys (§36): placeholders, aria
  labels, toasts, errors all included.
- Prices render as `₪` with Western Arabic numerals and `<bdi>` isolation.

### 20.2 Design System & Tokens (`src/styles/theme.css`)

The single token source, consumed by Tailwind v4's `@theme`.

- **Primitives:** `neutral` (11 steps), `blue` (11 steps), feedback scales
  (`success`, `warning`, `error`, `info` — each with `-50/-500/-600`).
- **Semantic tokens** (the ones components must use), bound to CSS variables
  that flip in `.dark`:
  - Backgrounds: `bg-background-primary/secondary/tertiary/dark/brand/elevated`
  - Text: `text-text-primary/secondary/tertiary/disabled/inverse/brand`
  - Borders: `border-border-default/subtle/strong/brand`
  - Interactive: `bg-interactive-primary[-hover|-active|-disabled]`,
    `bg-interactive-secondary[-hover|-active]`, `border-interactive-focus`
- **Fonts:** `font-english` (Inter), `font-arabic` (IBM Plex Sans Arabic),
  `font-hebrew` (Heebo), `font-sans`, `font-display-ar` (Tajawal) for large
  display headings.
- **Scale tokens:** text `xs…8xl` (with line-heights), weights, 4px spacing,
  radius `none…2xl`, durations/easings.
- **Component classes** (`@layer components`): `btn-primary`, `btn-secondary`,
  `btn-ghost`, `btn-danger`, `card-surface`, `heading-section`,
  `label-editorial`, `surface-card`, `surface-card-interactive`,
  `surface-card-elevated`, `scrollbar-thin`.

**Banned tokens (undefined in Tailwind v4 — never use):** `bg-surface`,
`text-foreground`, `text-muted-foreground`, `text-accent`, `bg-accent`,
`border-accent`, `border-destructive`, `text-destructive`, `text-brand-deep`,
`text-subtle`, `border-line`, `text-ink`, `bg-brand`, `shadow-soft-*`,
`bg-tech`/`text-tech`/`border-tech`, `bg-surface-hover`, `text-danger` — use the
semantic equivalents instead.

**Dark mode:** the `.dark` class on `<html>` (set by App.jsx) rewrites the CSS
variables backing every semantic token. Never add a separate `dark:` color
layer.

---

## 21. Responsive Design Rules

- Breakpoints: base (mobile-first, 375px+), `sm` 640, `md` 768, `lg` 1024,
  `xl` 1280, `2xl` 1536.
- Product grids: 2 cols mobile → 3 tablet → 4–5 desktop (`ProductGrid`).
- Filters: side panel ≥ `lg`; `MobileFilterDrawer` slides in below.
- **Sticky mobile "Add to Cart" bar** on product pages (fixed bottom,
  `lg:hidden`) so adding to cart never requires scrolling up — see the
  `(INSTRUCTIONS.md §21)` comment in `PDP.jsx`; keep it intact.
- Checkout stacks vertically on mobile; multi-column from `md`.
- Header: locale switcher + theme toggle + nav responsive; mobile menu is a
  slide-in drawer with `aria-expanded`.

## 22. Frontend Accessibility

- Semantic HTML first; ARIA only for what semantics can't express.
- Every icon-only button carries a **localized** `aria-label` from a locale key
  (`common.close`, `common.prevPage`, `common.decreaseQuantity`,
  `pdp.thumbnailAria`, etc.). Never hardcode English aria strings.
- `ui/Drawer.jsx` traps focus, returns focus to the trigger, closes on `Escape`.
- Visible focus (`focus:ring`/`focus:border`); never strip outlines silently.
- Skeletons use `aria-busy`/`aria-live`; toasts announce content.
- Touch targets ≥ ~40px on mobile; contrast maintained in both themes.

## 23. Frontend Loading & Empty States

- Skeletons (matching layout) for content loads — spinners only for small
  contained actions and route-level `PageFallback`.
- Every list has a designed, translated empty state: cart, wishlist, search
  (`common.searchEmpty`/`searchEmptyHint`), compare, no products.
- New empty/loading UI must use locale keys, never hardcoded text.

## 24. Frontend Error Handling

- Toasts via `useToastStore` (success/info/error) for cart, wishlist, compare
  limit, review submit, coupon errors, order success.
- Form errors render inline and clear while typing (checkout).
- NotFound (PDP slug), empty search, invalid coupon all have explicit
  translated UI with a next step.

## 25. Frontend Animations & Motion

- Tokenized durations/easings (`--duration-fast/normal/slow`,
  `--ease-standard`, `--ease-emphasized`) in `theme.css`.
- Add-to-cart toast + subtle `hero-float`; scroll reveal via `ui/Reveal.jsx`.
- `index.css` disables animation under `prefers-reduced-motion: reduce` —
  never bypass.

## 26. Frontend Performance

- Admin + checkout + compare are lazy-loaded (verified chunk-split in the
  Vite build output). Keep it that way.
- React Query defaults: 5 min `staleTime`, no refetch on window focus,
  `retry: 1`.
- `loading="lazy"` + fixed `width/height` on card/thumbnail images; the PDP
  hero image is `eager`.
- Grids paginate (8/page) — no full-render lists.
- Finish every change with `npm run lint` + `npm run build` (§3).

## 27. SEO Notes (SPA)

Client-rendered SPA — no SSR/SSG. PDP sets a per-product `document.title`; other
pages keep the default. Locale is switched client-side (not URL-encoded), so
per-language crawlability is limited today. Real SEO implies a server-rendering
layer (see §32).

## 28. Security Best Practices

Backend (implemented — do not regress):

- Passwords hashed with bcrypt; never store plaintext.
- Access + refresh JWT; refresh tokens stored as sha256 hashes; **rotation with
  reuse-detection** — a replayed refresh token revokes all sessions
  (`ADMIN_INVALID_REFRESH_TOKEN` / `MAINTENANCE_*`).
- Reset tokens: 64-hex, single-use, 30-min TTL, hash-only storage, identical
  responses regardless of whether the email exists.
- Rate limiting on auth/checkout; Zod validation on every route; RBAC verified
  server-side; Helmet + CORS (credentials) + cookie-parser httpOnly cookies.
- No raw card data — no payment storage exists; the `payments` table was removed
  (migration 006, see §16). Payment handling is deferred to §32.7.

Frontend:

- No secrets/keys committed; the "JWT" admin token is a demo mock string.
- localStorage holds no sensitive data (cart/wishlist/recent/prefs/mock token).
  Do not introduce client-side password or payment storage.

## 29. Demo Access & Credentials

**Frontend demo admin:** `admin@iphoneman.com` / `password123` (pre-filled).
**Frontend coupons:** `SAVE10` (10% off), `FREE20` (20 ₪ off) — hardcoded (§13).
**Backend seed users:** `admin@iphoneman.test` / `Admin12345` (store super admin);
`repair.admin@iphoneman.test` / `Maintain123`; `repair.worker@iphoneman.test` /
`Maintain123` (maintenance module).

---

## 30. Known Limitations & Integration Status

- **Frontend ↔ backend:** the SPA reads products from `/api/v1` with an offline
  fallback catalog; a dev proxy (`/api/v1` → `http://localhost:3000`) is in place
  (`vite.config.js`, §7). Admin, reviews, coupons, wishlist, and search in the
  storefront are still entirely client-side/demo and do **not** yet hit the
  backend endpoints (except products and checkout). Replacing the remaining demo
  flows with real API calls is the primary roadmap item (§32).
- **Fallback-catalog cannot be purchased:** products sourced from the embedded
  fallback catalog carry string ids (`p1`…`p17`) with no matching backend row.
  If any cart item has such an id, checkout **blocks the order** and shows the
  localized `checkout.demoItemsNotPurchasable` error — it never fabricates a
  fake success (CheckoutWizard.jsx, §14). This mainly happens when the API is
  unreachable so the store renders fallback products.
- **Checkout is connected** (COD-only): `POST /api/v1/checkout` persists the
  order server-side and step 3 reads the real `id`/`total` from the response,
  with specific toasts for `PRODUCT_NOT_FOUND` / `INSUFFICIENT_STOCK`. Coupons
  are not sent yet and are disabled in the `CartDrawer` UI pending
  `POST /api/v1/coupons/validate` (§13).
- **Backend auth is email-based** for staff/maintenance only; there are no
  customer accounts by design (§1).
- **SEO/SSR absent** (§27); locale not URL-encoded.
- Legacy frontend design tokens and dead components were removed in the v2
  audit; if re-introduced, restore the token too (§20).

## 31. Things to Avoid

- Mixing legacy and semantic frontend tokens (§20.2); hardcoding UI strings
  (§20.1); editing only one locale file (§36.4).
- Setting `dir`/`lang` per component — it's driven by `useUiStore`.
- Physical layout CSS (`left/right`, `margin-left`) where logical
  (`start/end`, `ms-*`) works; directional icons must use
  `rtl:rotate-0 ltr:rotate-180`.
- `setState` inside effect bodies; storing fetched data in Zustand.
- Adding customer accounts/registration — the product is guest-only.
- Backend: business logic in routes or controllers, skipping any MVCS layer,
  trusting client-computed monetary values (compute server-side).
- Removing or renumbering sections of this document that code/READMEs cite
  (§16–17, §21, §36.2, §39).

## 32. Future Improvements

1. The Vite dev proxy for `/api/v1` is now in place (`vite.config.js`). Consider
   switching PLP/PDP to rely entirely on the live API in production (keep the
   fallback for offline/demo).
2. Wire storefront cart/checkout/coupon/review flows to the real backend
   endpoints (auth-less storefront endpoints already exist).
3. Frontend admin → backend admin API (CRUD products/orders/categories/brands/
   reviews, analytics) with real RBAC.
4. Persist orders + transactional emails (confirmation, shipping) —
   `email.service.ts` exists, add a transport.
5. URL-encoded locales (`/en /ar /he`) for shareable, crawlable URLs and
   `hreflang`/`sitemap.xml`.
6. PWA/offline, image optimization, JSON-LD structured data.
7. Payments via a PCI-compliant provider (the `payments` table / `payment_status` enum were removed in migration 006; see §16 — this work would recreate them via a new migration).

## 33. Comments & Docs Convention

- Where code implements a specific file requirement, keep a short citation
  comment, e.g. `{/* INSTRUCTIONS.md §21 */}`. Update citations when the doc
  moves.
- Keep section numbers stable (§16–17, §21, §36, §39 are referenced from
  `backend/README.md` and frontend comments).

## 34. Backend — Configuration & Scripts

`.env` lives in `backend/` (gitignored). Validated at startup by
`src/config/env.ts` (a missing variable fails fast). Required keys:

```
NODE_ENV  PORT  DATABASE_URL  DB_SSL  CORS_ORIGIN
JWT_ACCESS_SECRET  JWT_REFRESH_SECRET  JWT_ACCESS_EXPIRES_IN  JWT_REFRESH_EXPIRES_IN
BCRYPT_ROUNDS  COOKIE_DOMAIN
MAINTENANCE_JWT_ACCESS_SECRET  MAINTENANCE_JWT_REFRESH_SECRET
```

> Note: `frontend build`/`dev` do **not** need backend env; the store falls back
> to its embedded catalog when the API is absent (§7). `CORS_ORIGIN` will be the
> frontend dev/prod origin once the proxy/SSR integration lands.

Scripts: `npm run dev|build|start|lint|test|test:integration|migrate|migrate:up|
migrate:down|seed` (see `backend/package.json`).

## 35. Backend — Testing

- `npm test` / `npm run test:integration` (Vitest + Supertest, `backend/tests/`).
- Unit tests cover services/utils; integration tests hit routes end-to-end
  (services mocked at the integration boundary per `backend/README.md`).
- Add a unit + integration test for every new service/route; the MVCS split
  makes both cheap (§17.1).

## 36. Internationalization (i18n) & RTL Support

Three supported languages: **English (en), Arabic (ar), Hebrew (he)** —
Arabic and Hebrew are RTL scripts, so RTL is first-class.

### 36.1 Locale Strategy

- **Default locale is `ar`** (matches the store's primary market and the
  `useUiStore` default). `useTranslation` defaults to `ar` if nothing is stored.
- Locale lives in `useUiStore`, persists to `iphone-man-ui-settings`, and is
  **not URL-encoded today** (§30).
- Header language switcher: three buttons `ع / EN / ע` with `setLocale`,
  `aria-pressed`, localized `aria-label`s (`langArabic`/`langEnglish`/
  `langHebrew`).
- `dir` = `rtl` for `ar`/`he`, `ltr` for `en`; `App.jsx` sets `<html dir>`
  and `<html lang>` on every change.

### 36.2 Translation Helper Contract

`useTranslation()` returns `{ t, locale, dir }`.

`t(path, fallback = '')`:

1. Walks the active dictionary by `path` (e.g. `'common.addToCart'`).
2. If a segment is missing, **falls back to the English dictionary** — never a
   raw key if English has it.
3. If English is also missing, returns `fallback` or the path.
4. **There is no interpolation.** Call sites substitute placeholders directly
   with `.replace('{name}', value)` etc. Used placeholders today:
   `{count} {number} {code} {year} {name} {query}`. Keep this replace pattern;
   do not add `:count`-style params.

This English-fallback rule is implemented in `useTranslation.js` (comment cites
"INSTRUCTIONS.md §36.2") and is a hard requirement: a missing `ar`/`he` value
must show the English string, never a blank field.

### 36.3 RTL Layout Requirements

- `dir` is set once on `<html>`; write components with **logical CSS**
  (`start`/`end`, `ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`) so the same code
  mirrors correctly.
- Directional icons flip via `className="… rtl:rotate-0 ltr:rotate-180"`
  (breadcrumbs, pagination, checkout continue). Non-directional icons never
  flip.
- Prices/quantities/IDs use Western numerals and `<bdi>` isolation.
- The checkout step stepper and progress bars read naturally RTL.

### 36.4 Locale Key Files

- `src/locales/{en,ar,he}.json` — **405 keys each**, and flattened key sets
  **must stay identical** across the three files. Add a key to all three at the
  same position.
- Namespaces: `common.*`, `nav.*`, `pdp.*`, `checkout.*`, `compare.*`,
  `aboutPage.*`, `contactPage.*`, `footer.*`, `home.*`, `wishlist.*`, `cart.*`,
  `admin.*`, plus `brandName`.
- Parity check (PowerShell, from `Frontend/`):

```powershell
$ref = Get-Content src\locales\en.json -Raw | ConvertFrom-Json
function Flat($o, $p='') { $r=@(); foreach($k in $o.PSObject.Properties){
  $n = if($p){"$p.$($k.Name)"}else{$k.Name}
  if($k.Value -is [System.Management.Automation.PSCustomObject]){ $r += Flat $k.Value $n } else { $r += $n }
}; $r }
foreach($f in 'ar','he'){ $d = Get-Content "src\locales\$f.json" -Raw | ConvertFrom-Json
  Write-Output "$f diffs: $((Compare-Object (Flat $ref) (Flat $d)).Count)" }
```

A non-zero diff means the locale files drifted — fix before committing.

## 37. Frontend Maintenance & Extension Guide

Adding a storefront feature end to end:

1. Add locale keys to `en/ar/he.json` together (§36.4).
2. Build under `features/<name>/components/`; import only `shared/*` and
   `ui/*`.
3. Use semantic tokens + `ui/*` primitives (`Button`, `Input`, `Drawer`,
   `SurfaceCard`, `Reveal`, `CompareTray`).
4. Server-ish data via React Query against `productsApi.js` (extend it if
   needed).
5. Cross-component client state → a small Zustand store under
   `shared/stores/`.
6. Register the route in `App.jsx` (lazy if it adds bundle size).
7. Verify in all 3 locales + RTL; run `npm run lint` and `npm run build`.

## 38. Verification Checklist (before "done")

- [ ] Affected package(s): `npm run lint` clean (no errors) and `npm run build`
      succeeds.
- [ ] New strings present in **all three** locale files; key sets identical
      (405 each — §36.4).
- [ ] No legacy tokens introduced; grep for
      `bg-surface|text-foreground|bg-tech` outside `INSTRUCTIONS.md` returns
      nothing in `Frontend/src`.
- [ ] No hardcoded user-facing strings in touched components.
- [ ] Screens checked in en/ar/he and light/dark.
- [ ] Backend path: `npm test` green; schema changes through `node-pg-migrate`;
      MVCS layers + validator present for new endpoints (§17.1).

---

## 39. Maintenance Service Module

**Scope note:** this module is fully independent of the storefront and the
e-commerce Admin Dashboard. It does not share tables, auth, or routes with
`admin_users`/`products`/`orders`. It tracks in-house device repair jobs for
walk-in customers — the customer brings their own device (never listed for
sale) and it never touches the products/orders schema. Fully implemented in
`backend/`; `backend/README.md` references this section.

### 39.1 Purpose

Staff record repair jobs (device type, part used, cost price, price charged)
and the system computes `net_amount` and `net_profit` after a per-job shop
percentage. Jobs are reviewed monthly with an `.xlsx` monthly export.

### 39.2 Roles & Auth

- `maintenance_users` — id, name, email, password_hash, role
  (`admin` | `worker`).
- `admin`: full access — all jobs, all workers, export.
- `worker`: create jobs + view only their own history (server-enforced).
- Auth is independent of `admin_users`; a maintenance admin is not a storefront
  `super_admin` and vice versa. Separate JWT secrets
  (`MAINTENANCE_JWT_*`), separate refresh/reset-token tables (`004`/`003`),
  separate guards (`maintenance-auth`, `maintenance-rbac` middleware).

### 39.3 Database Table — `maintenance_jobs`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | bigserial | PK |
| `worker_id` | FK → `maintenance_users` | RESTRICT on delete |
| `device_type` | text | e.g. "iPhone 13" |
| `part_type` | text | e.g. "Screen", "Battery" |
| `cost_price` | numeric(12,2) | part cost |
| `customer_price` | numeric(12,2) | charged to customer |
| `percentage` | numeric(5,2) | shop percentage per job |
| `net_amount` | numeric(12,2) | computed server-side: `customer_price - cost_price` |
| `net_profit` | numeric(12,2) | computed server-side: `net_amount - net_amount*percentage/100` |
| `created_at` | timestamptz | auto |

`net_amount`/`net_profit` are always computed in the service layer — never
trusted from client input.

### 39.4 Routes

See §17 (API surface table): `/api/v1/maintenance/auth/*` and
`/api/v1/maintenance/jobs*`, including the admin-only monthly
`/export?month=YYYY-MM` `.xlsx` download.

---

## 40. Updating This Document

- Reflect changes to the codebase here **at the time of the change** — this is
  the file an agent reads first.
- Keep section numbers stable (§16–17, §21, §36, §39 are referenced from code
  comments and `backend/README.md`).
- When an assumption turns out wrong, correct the prose here rather than
  patching behavior silently.
- Remember the current three-part truth: storefront SPA (backend-first w/
  offline catalog), real Express/Postgres API, and a fully independent
  maintenance module — plus a demo-only frontend admin.

_End of INSTRUCTIONS.md — the living source of truth for iPhone Man. When in
doubt, the code in `Frontend/src` and `backend/src` wins; when you change the
code, update this document._