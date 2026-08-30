# Refactor Plan: Feature-Based Architecture

## Current State Summary
- **Framework:** Vite 8 + React 19 + JSX (no TypeScript)
- **Styling:** Tailwind CSS v4 (CSS-first config in `index.css`)
- **State:** Only `useState` for view switching (no Zustand, no TanStack Query)
- **Routing:** None — `useState('home')` toggles between views
- **Source files:** 3 total — `main.jsx`, `App.jsx` (741 lines, 18 inline components), `index.css`
- **All data hardcoded** in App.jsx (products, categories, specs, navItems, TONE_ART)

## Target State
- Feature-based folder structure under `src/`
- React Router for URL-based navigation
- All 18 components extracted from App.jsx into separate files
- No new features, no logic changes beyond what's required by the move
- All existing functionality preserved

---

## Phase 1: Install React Router

```bash
npm install react-router-dom
```

No other new dependencies needed.

---

## Phase 2: Create Directory Structure

```
src/
  features/
    products/
      components/
      constants/
    admin/
      components/
    home/
      components/
  shared/
    components/
    layouts/
    constants/
    styles/
  App.jsx
  main.jsx
```

---

## Phase 3: Extract Shared Constants & Data

Move hardcoded data from App.jsx into dedicated files:

| Data | Current Location | Target File | Used By |
|------|-----------------|-------------|---------|
| `products` array | App.jsx:3-62 | `shared/constants/products.js` | HomePage, ProductsPage, AddProduct |
| `categories` array | App.jsx:64-69 | `shared/constants/products.js` | HomePage |
| `specs` array | App.jsx:71-77 | `features/products/constants/specs.js` | ProductDetail |
| `navItems` array | App.jsx:79-85 | `shared/constants/navigation.js` | StoreHeader |
| `TONE_ART` object | App.jsx:87-120 | `features/products/constants/toneArt.js` | ProductCard |
| `card`, `btnPrimary`, `btnGhost` | App.jsx:122-129 | `shared/constants/styles.js` | Multiple components |

---

## Phase 4: Extract Shared Components

These are reusable UI pieces used across multiple features:

| Component | Lines | Target File |
|-----------|-------|-------------|
| `StoreHeader` | 159-193 | `shared/components/StoreHeader.jsx` |
| `Footer` | 710-739 | `shared/components/Footer.jsx` |
| `ChipButton` | 311-324 | `shared/components/ChipButton.jsx` |
| `PageButton` | 326-337 | `shared/components/PageButton.jsx` |
| `Panel` | 692-699 | `shared/components/Panel.jsx` |
| `FieldLabel` | 701-708 | `shared/components/FieldLabel.jsx` |

**Changes required:**
- `StoreHeader`: Replace `onNavigate` prop with React Router `useNavigate()` + `<Link>` for nav items. Replace `activeView` prop with `useLocation()` for active state detection.
- All others: Minimal changes — just add imports for shared constants (`card`, `btnPrimary`, etc.).

---

## Phase 5: Extract Feature Components

### Products Feature (`features/products/`)

| Component | Lines | Target File |
|-----------|-------|-------------|
| `ProductCard` | 339-376 | `features/products/components/ProductCard.jsx` |
| `ProductDetail` | 378-439 | `features/products/components/ProductDetail.jsx` |
| `ProductsPage` | 261-308 | `features/products/components/ProductsPage.jsx` |
| `VariantPicker` | 442-467 | `features/products/components/VariantPicker.jsx` |
| `StorageOption` | 469-482 | `features/products/components/StorageOption.jsx` |

**Changes required:**
- `ProductCard`: Replace `onNavigate('detail')` with `<Link to="/product/...">` or `useNavigate()`. Import `card` from shared constants. Import `TONE_ART` from local constants.
- `ProductDetail`: Import `card`, `btnPrimary` from shared constants. Import `specs` from local constants.
- `ProductsPage`: Remove `onNavigate` prop (ProductCard handles its own navigation). Import `card`, `ChipButton`, `PageButton` from shared. Import `products` from shared constants.
- `VariantPicker`, `StorageOption`: No changes needed.

### Admin Feature (`features/admin/`)

| Component | Lines | Target File |
|-----------|-------|-------------|
| `AdminNavButton` | 520-534 | `features/admin/components/AdminNavButton.jsx` |
| `AdminDashboard` | 536-598 | `features/admin/components/AdminDashboard.jsx` |
| `AddProduct` | 630-690 | `features/admin/components/AddProduct.jsx` |
| `Progress` | 601-613 | `features/admin/components/Progress.jsx` |
| `AlertRow` | 615-628 | `features/admin/components/AlertRow.jsx` |

**Changes required:**
- `AdminNavButton`: Replace `onClick` prop with React Router `<Link>` or `useNavigate()`. The `active` prop stays (driven by `useLocation()` in the parent).
- `AdminDashboard`: Import `card` from shared constants.
- `AddProduct`: Import `card`, `ChipButton`, `Panel`, `FieldLabel` from shared. Import `ProductCard` from products feature (for preview). Import `products` from shared constants.
- `Progress`, `AlertRow`: No changes needed.

### Home Feature (`features/home/`)

| Component | Lines | Target File |
|-----------|-------|-------------|
| `HomePage` | 195-258 | `features/home/components/HomePage.jsx` |

**Changes required:**
- Replace `onNavigate('products')` with `useNavigate()` or `<Link to="/products">`.
- Import `card`, `btnPrimary`, `btnGhost` from shared constants.
- Import `ProductCard` from products feature.
- Import `categories`, `products` from shared constants.

---

## Phase 6: Create Layout Components

### `shared/layouts/StoreLayout.jsx`
Wraps the storefront shell (StoreHeader + Outlet + Footer):
```jsx
import { Outlet } from 'react-router-dom'
import StoreHeader from '../components/StoreHeader'
import Footer from '../components/Footer'

export default function StoreLayout() {
  return (
    <>
      <StoreHeader />
      <main className="w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
```

### `shared/layouts/AdminLayout.jsx`
Wraps the admin shell (sidebar + header + Outlet + Footer). Replaces `AdminChrome`:
```jsx
import { Outlet, Link, useLocation } from 'react-router-dom'
import AdminNavButton from '../features/admin/components/AdminNavButton'
import Footer from '../components/Footer'

export default function AdminLayout() {
  const { pathname } = useLocation()
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(14rem,17rem)_1fr] min-h-svh">
      <aside className="...">
        {/* sidebar nav with Links */}
      </aside>
      <div className="min-w-0">
        <header>...</header>
        <Outlet />
        <Footer />
      </div>
    </div>
  )
}
```

**Note:** `AdminChrome` (lines 484-518) is effectively replaced by `AdminLayout`. It is NOT extracted as a standalone component — its logic is absorbed into the layout.

---

## Phase 7: Set Up React Router in App.jsx

Replace the entire `App` component (lines 131-157) with:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StoreLayout from './shared/layouts/StoreLayout'
import AdminLayout from './shared/layouts/AdminLayout'
import HomePage from './features/home/components/HomePage'
import ProductsPage from './features/products/components/ProductsPage'
import ProductDetail from './features/products/components/ProductDetail'
import AdminDashboard from './features/admin/components/AdminDashboard'
import AddProduct from './features/admin/components/AddProduct'

export default function App() {
  return (
    <div dir="rtl" className="min-h-svh bg-[radial-gradient(...)] bg-background">
      <BrowserRouter>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
          </Route>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/add" element={<AddProduct />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  )
}
```

App.jsx shrinks from **741 lines to ~25 lines** (imports + router config).

---

## Phase 8: Verify

1. Run `npm run dev` — app should start without errors
2. Navigate to `/` — HomePage renders with hero, categories, featured products
3. Navigate to `/products` — ProductsPage renders with filter sidebar + product grid
4. Click a product card — navigates to `/product/:slug`, ProductDetail renders
5. Navigate to `/admin` — AdminLayout renders with sidebar + AdminDashboard
6. Click "إضافة منتجات" in admin sidebar — navigates to `/admin/add`, AddProduct renders
7. Click "المنتجات" in admin sidebar — navigates to `/products` (storefront)
8. All existing functionality preserved

---

## Files Modified/Created Summary

### New Files (19)
```
src/shared/constants/products.js
src/shared/constants/navigation.js
src/shared/constants/styles.js
src/shared/components/StoreHeader.jsx
src/shared/components/Footer.jsx
src/shared/components/ChipButton.jsx
src/shared/components/PageButton.jsx
src/shared/components/Panel.jsx
src/shared/components/FieldLabel.jsx
src/shared/layouts/StoreLayout.jsx
src/shared/layouts/AdminLayout.jsx
src/features/products/components/ProductCard.jsx
src/features/products/components/ProductDetail.jsx
src/features/products/components/ProductsPage.jsx
src/features/products/components/VariantPicker.jsx
src/features/products/components/StorageOption.jsx
src/features/products/constants/specs.js
src/features/products/constants/toneArt.js
src/features/admin/components/AdminNavButton.jsx
src/features/admin/components/AdminDashboard.jsx
src/features/admin/components/AddProduct.jsx
src/features/admin/components/Progress.jsx
src/features/admin/components/AlertRow.jsx
src/features/home/components/HomePage.jsx
```

### Modified Files (2)
- `src/App.jsx` — gutted from 741 to ~25 lines, now just router config
- `src/main.jsx` — no changes expected (just renders `<App />`)

### Unchanged Files (1)
- `src/index.css` — no changes

### Deleted
- `AdminChrome` component — absorbed into `AdminLayout`
