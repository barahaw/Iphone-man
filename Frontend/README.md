# iPhone Man — Frontend

Trilingual (en/ar/he) single-page storefront for **iPhone Man**, built with
Vite 8 + React 19. Includes a full product catalog with filters, cart with
coupons, guest checkout, wishlist, product comparison, reviews, a "recently
viewed" rail, and a demo admin dashboard.

## Quick start

```bash
npm install
npm run dev       # dev server → http://localhost:5173
npm run lint      # ESLint (must pass: zero errors)
npm run build     # production build (must pass)
npm run preview   # preview the production build
```

## Documentation

This document is a pointer only. The full, authoritative specification
(architecture, state tiers, design-system tokens, i18n & RTL rules,
integration, and the accompanying `backend/` API) lives in
**[`INSTRUCTIONS.md`](../INSTRUCTIONS.md)** one level up. Read it before
changing any code — especially §7 (data layer / backend integration),
§20 (coding standards & design system), §36 (i18n & RTL), and §38
(verification checklist).

## How it works

- **Backend-first with offline fallback:** product listing/detail fetch the
  real API at `/api/v1`; when it is unreachable, `src/shared/api/productsApi.js`
  falls back to an embedded catalog, so the store runs fully standalone.
- **State:** TanStack Query (server data) + Zustand (global client state) +
  `useState` (local), never mixed (§5–§6).
- **i18n:** `en/ar/he` locales in `src/locales/`, English-fallback lookup,
  full RTL support. Keys must stay identical across the three files (§36).
- **Demo admin:** `/admin/login` → `admin@iphoneman.com` / `password123`.

See the monorepo root [`INSTRUCTIONS.md`](../INSTRUCTIONS.md) for everything
else.