# MIGRATION_PLAN.md

## iPhone Man — Frontend Migration Plan

**Source:** Old Vite/React app (`Frontend/`) → New Next.js 15 App Router (`apps/web/`)
**Date created:** 2026-08-25
**Status:** Phases 1–4 complete. Phase 5 pending (final integration & deployment).

---

## Phase 1: Foundation ✅

**Goal:** Scaffold the new Next.js app with i18n, styling, RTL support, and dark/light mode.

**Completed work:**
- Next.js 15 App Router project at `apps/web/` (monorepo package)
- `next-intl` i18n with three locales: `en`, `ar` (default), `he`
- Middleware for locale detection and URL prefixing (`/en/*`, `/ar/*`, `/he/*`)
- Tailwind CSS v4 with custom design tokens in `globals.css` (§7, §25, §26, §27, §30)
- shadcn/ui component library — `base-vega` preset (chosen for §7 premium aesthetic alignment)
- `TooltipProvider` added to `providers.jsx` and wrapped in locale layout
- RTL support via `dir="rtl"` and `lang` attribute on `<html>`
- Dark/light mode CSS variables (both modes first-class, per §7)
- Google Fonts: Inter (en), IBM Plex Sans Arabic (ar), Noto Sans Hebrew (he)

**Key decisions:**
- Default locale is `'ar'` (Arabic primary market — Palestine)
- `base-vega` shadcn style over `base-nova` — vega's generous spacing and soft `shadow-xs` better match §7's "fewer, larger touch targets" and "soft, low-opacity shadows" requirements
- Country default in checkout is `'PS'` (Palestine)

---

## Phase 2: Component Migration ✅

**Goal:** Port all storefront components from old Vite/React app to Next.js, replacing old design tokens with shadcn tokens and Radix UI primitives.

**Completed work:**

| Component | Old location | New location | Notes |
|---|---|---|---|
| `StoreHeader` | `components/StoreHeader.jsx` | `components/layout/StoreHeader.jsx` | Migrated from custom nav to shadcn Sheet-based mobile menu |
| `Footer` | `components/Footer.jsx` | `components/layout/Footer.jsx` | Migrated, removed old token refs |
| `StoreShell` | — (new) | `components/layout/StoreShell.jsx` | Layout wrapper (header + main + footer) |
| `ProductCard` | `components/ProductCard.jsx` | `components/product/ProductCard.jsx` | Uses shadcn Card, Badge; locale-aware Link |
| `ProductGrid` | — (new) | `components/product/ProductGrid.jsx` | Responsive grid layout |
| `FilterSidebar` | — (new) | `components/product/FilterSidebar.jsx` | Multi-facet filters (price, brand, compat, rating) |
| `PLPContent` | — (new) | `components/product/PLPContent.jsx` | Category/listing page content |
| `PDPContent` | — (new) | `components/product/PDPContent.jsx` | Product detail page content |
| `SearchContent` | — (new) | `components/product/SearchContent.jsx` | Search results page |
| `CartDrawer` | `components/CartDrawer.jsx` | `components/cart/CartDrawer.jsx` | Migrated to shadcn Sheet (replaces HeadlessUI Dialog) |
| `CartPageContent` | — (new) | `components/cart/CartPageContent.jsx` | Full cart page view |
| `WishlistContent` | `components/WishlistContent.jsx` | `components/wishlist/WishlistContent.jsx` | Migrated, empty wishlist state |
| `CheckoutWizard` | `components/CheckoutWizard.jsx` | `components/checkout/CheckoutWizard.jsx` | 3-step wizard (shipping → payment → confirm) |
| `HomePage` | `components/HomePage.jsx` | `components/home/HomePage.jsx` | Featured products, categories, brands, promo |
| `Providers` | — (new) | `components/providers.jsx` | QueryClientProvider + TooltipProvider |

**Pages wired:**
- `[locale]/(storefront)/page.jsx` → `HomePage`
- `[locale]/cart/page.jsx` → `CartPageContent`
- `[locale]/checkout/page.jsx` → `CheckoutWizard`
- `[locale]/wishlist/page.jsx` → `WishlistContent`
- `[locale]/category/[slug]/page.jsx` → `PLPContent`
- `[locale]/product/[slug]/page.jsx` → `PDPContent`
- `[locale]/search/page.jsx` → `SearchContent`

**Placeholder pages (Phase 4 scope):**
- `[locale]/dashboard/page.jsx`
- `[locale]/login/page.jsx`

---

## Phase 3: Data Layer & Integration ✅

**Goal:** Build mock data, state management, i18n strings, and wire everything to the real page components.

**Completed work:**

### Mock Data Layer (`apps/web/src/lib/api/`)
- `mock-data.js` — 42 products (ar/he translations), 14 categories, 12 brands
- `products.js` — `getProducts()`, `getProductBySlug()`, `getFeaturedProducts()`
- `categories.js` — `getCategories()`, `getCategoryBySlug()`
- `brands.js` — `getBrands()`, `getBrandBySlug()`
- `hooks.js` — TanStack Query hooks: `useProducts()`, `useProduct()`, `useCategories()`, `useBrands()`
- `index.js` — barrel export

**Mock API envelope:** `{ data, error, meta }` with `meta.total`, `meta.hasMore`

### Zustand Stores (`apps/web/src/stores/`)
| Store | Persistence | Initial state | Notes |
|---|---|---|---|
| `useCartStore` | localStorage | `{ items: [] }` | Add/remove/update quantity/clear |
| `useWishlistStore` | localStorage | `{ items: [] }` | Add/remove/move to cart |
| `useUiStore` | localStorage (locale+theme only) | `{ locale: 'ar', theme: 'system' }` |
| `useFilterStore` | in-memory | `{ price, brands, compatibility, rating, inStock }` | Category page filters |
| `useCheckoutStore` | in-memory | `{ step, shipping, payment }` | 3-step wizard state |

### i18n Messages
- `en.json`, `ar.json`, `he.json` — each with 5 namespaces:
  - `nav` (11 keys) — navigation labels
  - `common` (40 keys) — shared UI strings
  - `home` (44 keys) — homepage sections
  - `pdp` (8 keys) — product detail
  - `checkout` (19 keys) — checkout flow
- Total: 122 keys per locale, all fully translated
- Zero hardcoded UI strings in components

### Build Status
- `next build` passes cleanly — zero warnings, zero errors
- 24 static pages generated across 3 locales
- All old design tokens (`bg-surface`, `shadow-soft-*`, `text-tech`, etc.) removed from storefront components
- Admin pages (`login`, `dashboard`) still contain old tokens — Phase 4 scope

---

## Phase 4: Admin Dashboard & Maintenance Service Module ✅

**Goal:** Build the authenticated admin dashboard and the independent maintenance service module.

**Status:** COMPLETE — all screens built, clean build (51 static pages, zero warnings).

### 4.1 Admin Authentication (§13, §24) ✅
- Login page with email/password form (`admin/login/page.jsx`)
- `useAdminAuthStore` Zustand store (accessToken in memory, admin info, login/logout)
- `adminFetch()` API helper with automatic token refresh via httpOnly cookies
- Route protection: redirect to `/login` if unauthenticated
- Roles: `super_admin` vs `staff` (both have CRUD access; only `super_admin` can delete)

### 4.2 Admin Layout ✅
- Collapsible sidebar navigation (`AdminSidebar.jsx`) with icons for all modules
- Top-level `AdminLayout.jsx` wrapper with sidebar + main content area
- Responsive: sidebar collapses to icons on small screens
- Auth gate: redirect to login if not authenticated

### 4.3 Dashboard Overview (§13) ✅
- `DashboardOverview.jsx` with stat cards (revenue week/month, orders week/month)
- Top selling products list
- Low stock alerts with color-coded badges
- Recent orders feed with status badges

### 4.4 Product CRUD (§15) ✅
- `ProductsScreen.jsx` with DataTable, search, pagination
- EntityForm dialog for create/edit (9 fields: name, slug, brandId, categoryId, description, price, discount, stockQuantity, isActive)
- Delete with confirmation dialog
- Color-coded stock badges (red/yellow/green)

### 4.5 Category + Brand CRUD ✅
- `CategoriesScreen.jsx`: Name, Slug, Display Order; create/edit/delete
- `BrandsScreen.jsx`: Name, Slug, Logo URL, Description; create/edit/delete

### 4.6 Coupon CRUD + Order Management ✅
- `CouponsScreen.jsx`: Code, Type (percentage/fixed), Value, Min Order, Expires, Usage; create/edit/delete
- `OrdersScreen.jsx`: ID, Customer, Email, Total, Status (inline Select dropdown for status changes), Date; pagination

### 4.7 Review Moderation + Inventory ✅
- `ReviewsScreen.jsx`: Placeholder (PATCH endpoint exists but no list endpoint for admin yet)
- `InventoryScreen.jsx`: Stock levels with color-coded badges, low-stock count

### 4.8 Maintenance Service Module (§39) ✅
- Separate login page: `maintenance/login/page.jsx`
- Separate auth: `useMaintenanceAuthStore` (independent JWT system)
- `MaintenanceDashboard.jsx`: Job list with Device, Part, Cost, Customer, Net Amount, Net Profit
- Create/Edit/Delete jobs with form dialog
- Month filter + XLSX export button
- Worker/admin role distinction (admin sees all, worker sees own)

### 4.9 Shared Components ✅
- `DataTable.jsx`: Reusable table with search, pagination, loading skeletons
- `EntityForm.jsx`: Reusable create/edit dialog with dynamic fields
- `admin.js` API module: All admin + maintenance endpoint functions
- `client.js` API module: Auth helpers, token management, auto-refresh

### 4.10 i18n ✅
- Added `admin` namespace to all 3 locale files (en, ar, he)
- Keys: login, nav, dashboard, products, categories, brands, orders, reviews, coupons, inventory, maintenance

### Pages created (27 new admin pages × 3 locales = 51 total)
- `/[locale]/login` — Admin login
- `/[locale]/dashboard` — Dashboard overview
- `/[locale]/dashboard/products` — Product CRUD
- `/[locale]/dashboard/categories` — Category CRUD
- `/[locale]/dashboard/brands` — Brand CRUD
- `/[locale]/dashboard/orders` — Order management
- `/[locale]/dashboard/reviews` — Review moderation
- `/[locale]/dashboard/coupons` — Coupon CRUD
- `/[locale]/dashboard/inventory` — Inventory management
- `/[locale]/maintenance/login` — Maintenance login
- `/[locale]/maintenance/dashboard` — Maintenance jobs

---

## Phase 5: Final Integration & Deployment

**Goal:** Replace mock data with real API, optimize performance, add email templates, and deploy.

**Status:** NOT STARTED — blocked on Phase 4 completion.

### 5.1 Real API Integration
- Replace mock data layer with actual REST API calls
- Wire TanStack Query hooks to real endpoints (`/api/v1/products`, `/api/v1/categories`, etc.)
- Error handling and loading states for all API calls
- Pagination and infinite scroll

### 5.2 Image Upload
- Cloudinary integration for product/category/brand images
- Upload widget in admin forms
- Image optimization (responsive sizes, WebP)

### 5.3 Email Templates
- Order confirmation email (transactional)
- Shipping update email
- Password reset email (admin + maintenance)

### 5.4 Performance Optimization
- Image optimization (`next/image`)
- Font optimization (`next/font`)
- Bundle analysis and code splitting
- Lazy loading for below-fold content
- LCP under 2.5s, TTI under 3.5s (§11)

### 5.5 SEO
- Meta tags for all pages (title, description, OG tags)
- Structured data (JSON-LD) for products
- Sitemap generation
- Robots.txt

### 5.6 Testing
- Unit tests for Zustand stores and utility functions
- Integration tests for API hooks
- E2E tests for critical user journeys (browse → cart → checkout)
- Accessibility audit (§20)

### 5.7 Deployment
- Vercel deployment configuration
- Environment variables setup
- CI/CD pipeline
- Monitoring and error tracking (Sentry, per §11)

---

## Decision Log

| Decision | Date | Rationale |
|---|---|---|
| Default locale = `ar` | Phase 1 | Arabic is the primary market (Palestine) |
| Country default = `PS` | Phase 1 | Palestine as primary shipping destination |
| shadcn `base-vega` over `base-nova` | Phase 3 | Vega's generous spacing and soft shadows better match §7's premium aesthetic. Nova was too compact. Sera (brutalist) was disqualified. |
| Empty cart/wishlist stores | Phase 3 | Old stores had seeded fake items — bug. Fresh start with empty arrays. |
| Mock data layer separate from API | Phase 3 | Allows frontend development without backend dependency. Mock layer is easily swappable. |
| Maintenance module = Phase 4 | Planning | §39 is a fully independent module. Backend API is ready (`openapi.json`). Frontend needs its own auth flow and CRUD screens. |
| Admin token stored in memory | Phase 4 | Access tokens held in JS variable (not localStorage) for security. Refresh via httpOnly cookie. |
| Reviews screen = placeholder | Phase 4 | PATCH endpoint exists but no admin list endpoint for reviews yet. Placeholder shown. |

---

## File Structure (apps/web/src/)

```
app/
├── [locale]/
│   ├── layout.jsx              ← locale layout + Providers + StoreShell
│   ├── (storefront)/
│   │   ├── page.jsx            ← HomePage
│   │   ├── cart/page.jsx       ← CartPageContent
│   │   ├── checkout/page.jsx   ← CheckoutWizard
│   │   ├── wishlist/page.jsx   ← WishlistContent
│   │   ├── category/[slug]/page.jsx  ← PLPContent
│   │   ├── product/[slug]/page.jsx   ← PDPContent
│   │   └── search/page.jsx     ← SearchContent
│   ├── (admin)/
│   │   ├── login/page.jsx          ← AdminLoginForm
│   │   └── dashboard/
│   │       ├── page.jsx            ← DashboardOverview (analytics)
│   │       ├── products/page.jsx   ← ProductsScreen
│   │       ├── categories/page.jsx ← CategoriesScreen
│   │       ├── brands/page.jsx     ← BrandsScreen
│   │       ├── orders/page.jsx     ← OrdersScreen
│   │       ├── reviews/page.jsx    ← ReviewsScreen (placeholder)
│   │       ├── coupons/page.jsx    ← CouponsScreen
│   │       └── inventory/page.jsx  ← InventoryScreen
│   └── maintenance/                ← §39 (fully independent)
│       ├── login/page.jsx          ← MaintenanceLoginForm
│       └── dashboard/page.jsx      ← MaintenanceDashboard
├── globals.css                 ← design tokens + shadcn overrides
components/
├── layout/
│   ├── StoreHeader.jsx
│   ├── Footer.jsx
│   └── StoreShell.jsx
├── product/
│   ├── ProductCard.jsx
│   ├── ProductGrid.jsx
│   ├── FilterSidebar.jsx
│   ├── PLPContent.jsx
│   ├── PDPContent.jsx
│   └── SearchContent.jsx
├── cart/
│   ├── CartDrawer.jsx
│   └── CartPageContent.jsx
├── wishlist/
│   └── WishlistContent.jsx
├── checkout/
│   └── CheckoutWizard.jsx
├── home/
│   └── HomePage.jsx
├── ui/                         ← shadcn components (base-vega)
│   ├── button.jsx, card.jsx, input.jsx, ...
├── providers.jsx               ← QueryClientProvider + TooltipProvider
├── theme-toggle.jsx
└── admin/
    ├── AdminLayout.jsx          ← sidebar + main content wrapper
    ├── AdminSidebar.jsx         ← collapsible nav sidebar
    ├── AdminLoginForm.jsx       ← admin login form
    ├── MaintenanceLoginForm.jsx ← maintenance login form
    ├── MaintenanceDashboard.jsx ← maintenance jobs CRUD
    ├── DashboardOverview.jsx    ← analytics stat cards + lists
    ├── DataTable.jsx            ← reusable table with search/pagination
    ├── EntityForm.jsx           ← reusable create/edit dialog
    ├── ProductsScreen.jsx       ← product CRUD
    ├── CategoriesScreen.jsx     ← category CRUD
    ├── BrandsScreen.jsx         ← brand CRUD
    ├── CouponsScreen.jsx        ← coupon CRUD
    ├── OrdersScreen.jsx         ← order management
    ├── ReviewsScreen.jsx        ← review moderation (placeholder)
    └── InventoryScreen.jsx      ← stock levels dashboard
lib/
├── api/
│   ├── mock-data.js            ← mock data (Phase 3)
│   ├── products.js             ← public product API (Phase 3)
│   ├── categories.js           ← public category API (Phase 3)
│   ├── brands.js               ← public brand API (Phase 3)
│   ├── hooks.js                ← TanStack Query hooks (Phase 3)
│   ├── index.js                ← barrel export (Phase 3)
│   ├── client.js               ← auth helpers, token mgmt, auto-refresh (Phase 4)
│   └── admin.js                ← admin + maintenance API functions (Phase 4)
└── utils.js
stores/
├── useCartStore.js             ← Phase 3
├── useWishlistStore.js         ← Phase 3
├── useUiStore.js               ← Phase 3
├── useFilterStore.js           ← Phase 3
├── useCheckoutStore.js         ← Phase 3
├── useAdminAuthStore.js        ← admin + maintenance auth (Phase 4)
└── index.js                    ← barrel export
messages/
├── en.json                     ← 122 keys (5 namespaces)
├── ar.json                     ← 122 keys
└── he.json                     ← 122 keys
```
