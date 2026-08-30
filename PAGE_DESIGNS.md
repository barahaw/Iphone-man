# PAGE_DESIGNS.md — Comprehensive Page Wireframes & Component Mockups

**Specification Source:** [INSTRUCTIONS.md](file:///c:/Users/HP/Desktop/iphone-man/INSTRUCTIONS.md)  
**Design System Reference:** [DESIGN_SYSTEM.md](file:///c:/Users/HP/Desktop/iphone-man/DESIGN_SYSTEM.md) | [RTL_NOTES.md](file:///c:/Users/HP/Desktop/iphone-man/RTL_NOTES.md)

---

## Page 1: Home / Landing Page

### 1. Concept & Rationale
The Home page creates an immediate high-trust, Apple-inspired luxury impression. It features a hero banner showcasing flagship smartphones, quick category pills (Smartphones, Smartwatches, Earbuds, Chargers, Cases, etc.), a curated "Featured Arrivals" 4-column grid, brand showcase logos (Apple, Samsung, Nothing, Anker), and trust guarantee cards (Official Warranty, Free Shipping, 14-Day Returns).

### 2. ASCII Wireframe
```
+-------------------------------------------------------------------------------+
| [Header] Logo "iPhone Man" | Nav Links | Search Bar | Wishlist(0) | Cart(2)   |
+-------------------------------------------------------------------------------+
| HERO BANNER                                                                   |
| [ High-Res Product Photography: iPhone 15 Pro Titanium ]                     |
| "Titanium Power. Unmatched Elegance."                                         |
| [ Explore Flagship Smartphones (CTA Primary) ]   [ Browse Accessories (Sec) ] |
+-------------------------------------------------------------------------------+
| CATEGORY QUICK STRIP                                                         |
| ( Smartphones ) ( Smartwatches ) ( Wireless Earbuds ) ( Chargers ) ( Cases )  |
+-------------------------------------------------------------------------------+
| FEATURED PRODUCTS (4-Column Grid)                                            |
| +-----------------+ +-----------------+ +-----------------+ +-----------------+ |
| | [1:1 Image Stage| | [1:1 Image Stage| | [1:1 Image Stage| | [1:1 Image Stage| |
| | iPhone 15 Pro   | | Galaxy S24 Ultra| | Nothing Ear (a) | | Anker 65W GaN   | |
| | $999.00         | | $1,199.00       | | $99.00          | | $49.99          | |
| | [ Add to Cart ] | | [ Add to Cart ] | | [ Add to Cart ] | | [ Add to Cart ] | |
| +-----------------+ +-----------------+ +-----------------+ +-----------------+ |
+-------------------------------------------------------------------------------+
| BRAND PARTNERS (Apple, Samsung, Nothing, Anker, Spigen)                       |
+-------------------------------------------------------------------------------+
| TRUST SIGNALS: [ 2-Year Warranty ]  [ Free Fast Delivery ]  [ Secure Checkout]|
+-------------------------------------------------------------------------------+
| [Footer: Categories | Support | Payment Badges | Copyright]                   |
+-------------------------------------------------------------------------------+
```

### 3. Component Architecture & Code Snippet
```tsx
// features/home/components/HomePage.tsx
import React from 'react';

export function HomePage() {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-surface to-background border border-border/60 p-8 md:p-16">
        <div className="max-w-2xl space-y-6 text-start">
          <span className="inline-block rounded-full bg-accent/10 px-3.5 py-1 text-xs font-semibold text-accent">
            New Arrival • 2026 Collection
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Titanium Power.<br />Unmatched Elegance.
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover the latest smartphones, pro audio, and high-speed GaN chargers with official manufacturer warranty.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button className="rounded-xl bg-accent px-6 py-3.5 font-medium text-white shadow-soft-sm hover:bg-accent-hover transition-colors">
              Explore Flagships
            </button>
            <button className="rounded-xl border border-border bg-surface px-6 py-3.5 font-medium text-foreground hover:bg-border/40 transition-colors">
              Browse Accessories
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
```

---

## Page 2: Product Listing Page (PLP) — Search & Smart Filters

### 1. Concept & Rationale
The PLP empowers users to quickly discover products across 14+ categories with multi-faceted filtering (Price range slider, Brand checkboxes, Device Compatibility selector, In-Stock filter, Rating filter). Includes real-time search with instant debounced API calls, active filter chips with 1-click removal, and sorting dropdown.

### 2. ASCII Wireframe
```
+-------------------------------------------------------------------------------+
| Breadcrumbs: Home / Smartphones                                               |
| Title: "Smartphones & Devices" (24 items found)           [ Sort: Featured v ]|
+-------------------------------------------------------------------------------+
| ACTIVE FILTERS: [ Brand: Apple (x) ] [ Max: $1200 (x) ] [ Clear All ]         |
+------------------------------+------------------------------------------------+
| SIDEBAR FILTERS (Sticky)     | PRODUCT GRID (3-4 Columns)                     |
| Search: [ Type model...  ]   | +--------------+ +--------------+ +------------+ |
|                              | | [Sale -10%]  | | [In Stock]   | | [In Stock] | |
| Category:                    | | iPhone 15 Pro| | Galaxy S24   | | Pixel 8 Pro| |
| [x] Smartphones              | | Apple        | | Samsung      | | Google     | |
| [ ] Accessories              | | $999 ($1099) | | $899.00      | | $799.00    | |
|                              | | ★ 4.9 (128)  | | ★ 4.8 (86)   | | ★ 4.7 (42) | |
| Brand:                       | | [Add to Cart]| | [Add to Cart]| |[Add to Cart| |
| [x] Apple  [ ] Samsung       | +--------------+ +--------------+ +------------+ |
| [ ] Nothing [ ] Anker        |                                                |
|                              | [ Pagination: < 1  2  3 > ]                    |
| Price: [$0 ------|--- $2000] |                                                |
+------------------------------+------------------------------------------------+
```

### 3. Component Architecture & Code Snippet
```tsx
// features/products/components/PLP.tsx
export function ProductListingPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 py-8 text-start">
      {/* Sticky Filter Sidebar */}
      <aside className="space-y-6 lg:col-span-1 border-e border-border/40 pe-6">
        <h3 className="font-semibold text-lg text-foreground">Filters</h3>
        {/* Brand Checkboxes */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand</label>
          {['Apple', 'Samsung', 'Google', 'Nothing', 'Anker'].map(brand => (
            <label key={brand} className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer">
              <input type="checkbox" className="rounded-md border-border text-accent focus:ring-accent" />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </aside>

      {/* Main Grid Area */}
      <main className="lg:col-span-3 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {/* Product Cards */}
        </div>
      </main>
    </div>
  );
}
```

---

## Page 3: Product Detail Page (PDP)

### 1. Concept & Rationale
The PDP uses progressive disclosure: high-res 1:1 image gallery with thumbnail previews on the left, purchase panel on the right (variants, color/storage selector, stock badge, warranty badge, Add to Cart & Wishlist buttons). Below the fold: full technical specifications table, device compatibility chips, customer reviews breakdown, and recommended accessories. Features a **Sticky Mobile Add-to-Cart Bar** for screens < 768px.

### 2. ASCII Wireframe
```
+-------------------------------------------------------------------------------+
| Breadcrumbs: Home / Smartphones / iPhone 15 Pro                               |
+---------------------------------------+---------------------------------------+
| GALLERY COLUMN                        | PURCHASE & DETAILS COLUMN             |
| +-----------------------------------+ | Apple iPhone 15 Pro                   |
| |                                   | | Brand: Apple | SKU: AP-15P-256       |
| |   [ 1:1 High-Res Cover Image ]   | | ★ 4.9 (128 customer reviews)        |
| |                                   | |                                       |
| +-----------------------------------+ | $999.00  [ In Stock - 12 units ]      |
| [Thumb1] [Thumb2] [Thumb3] [Thumb4]   | Color: ( ) Natural  (*) Blue  ( ) Black|
|                                       | Storage: [ 128GB ] [* 256GB *] [ 512GB|
|                                       | [ 2-Year Official Apple Warranty ]    |
|                                       |                                       |
|                                       | [ + Add to Cart ]  [ ♡ Wishlist ]    |
+---------------------------------------+---------------------------------------+
| TECHNICAL SPECIFICATIONS              | COMPATIBILITY                          |
| Processor: A17 Pro (3nm)              | Fits: iPhone 15 Pro Only              |
| Display: 6.1" Super Retina XDR OLED  | USB Type: USB-C 3.0 (up to 10Gbps)    |
+-------------------------------------------------------------------------------+
| CUSTOMER REVIEWS (4.9 / 5.0)          | [ + Write a Review ]                  |
+-------------------------------------------------------------------------------+
| STICKY MOBILE BAR (Mobile only): iPhone 15 Pro - $999.00   [ Add to Cart ]    |
+-------------------------------------------------------------------------------+
```

---

## Page 4: Shopping Cart (Drawer & Page)

### 1. Concept & Rationale
Cart is guest-only and persisted in browser `localStorage` via Zustand (`useCartStore`). Includes quantity steppers (`- 1 +`), variant labels, line item totals, coupon discount code input, subtotal / shipping / tax breakdown, and clear primary CTA to proceed to guest checkout. Available as both a quick slide-over drawer and a dedicated page `/cart`.

### 2. ASCII Wireframe
```
+-------------------------------------------------------------------------------+
| SHOPPING CART (2 items)                                                       |
+----------------------------------------------------+--------------------------+
| CART ITEMS LIST                                    | ORDER SUMMARY            |
| +------------------------------------------------+ | Subtotal:        $1,048.99|
| | [Img] iPhone 15 Pro (256GB, Natural Titanium)  | | Estimated Tax:      $83.92|
| |       $999.00   Qty: [ - ] 1 [ + ]   [ Remove ]| | Shipping:            FREE|
| +------------------------------------------------+ | Coupon (SAVE10):  -$100.00|
| | [Img] Anker 65W GaN Fast Charger               | | ------------------------|
| |       $49.99    Qty: [ - ] 1 [ + ]   [ Remove ]| | Total:           $1,032.91|
| +------------------------------------------------+ |                          |
| PROMO CODE: [ Enter coupon code... ] [ Apply ]     | [ Proceed to Checkout ->]|
+----------------------------------------------------+--------------------------+
```

---

## Page 5: Wishlist Page

### 1. Concept & Rationale
Client-side wishlist backed by Zustand (`useWishlistStore`) stored in `localStorage` without requiring user registration. Displays saved items in a clean grid with quick "Move to Cart" button, price indicators, and empty state with recommended products.

### 2. ASCII Wireframe
```
+-------------------------------------------------------------------------------+
| MY WISHLIST (3 Saved Items)                                                   |
+-------------------------------------------------------------------------------+
| +-------------------+ +-------------------+ +-------------------+             |
| | [1:1 Image]       | | [1:1 Image]       | | [1:1 Image]       |             |
| | Nothing Ear (a)   | | Galaxy Watch 6 Pro| | Spigen Ultra Hybrid|            |
| | $99.00            | | $299.00           | | $24.99            |             |
| | [ Move to Cart ]  | | [ Move to Cart ]  | | [ Move to Cart ]  |             |
| | [ Remove (x) ]    | | [ Remove (x) ]    | | [ Remove (x) ]    |             |
| +-------------------+ +-------------------+ +-------------------+             |
+-------------------------------------------------------------------------------+
| EMPTY STATE (when 0 items saved):                                            |
| [ Heart Icon ] "Your wishlist is empty." [ Explore Featured Products ]        |
+-------------------------------------------------------------------------------+
```

---

## Page 6: Guest Checkout Flow (3-Step Wizard)

### 1. Concept & Rationale
Frictionless guest checkout (INSTRUCTIONS.md §10). **No login or account creation required**.
- **Step 1:** Customer Contact & Shipping Address (Name, Email, Phone, Street, City, Country)
- **Step 2:** Payment Method (Credit/Debit Card via Stripe, Apple Pay, Cash on Delivery)
- **Step 3:** Order Confirmation screen with order number `#IPM-84920` and estimated delivery window.

### 2. ASCII Wireframe
```
+-------------------------------------------------------------------------------+
| CHECKOUT  ( [1. Shipping] ----> [2. Payment] ----> [3. Confirmation] )        |
+----------------------------------------------------+--------------------------+
| STEP 1: SHIPPING INFORMATION (Guest)               | ORDER SUMMARY (2 items)  |
| Full Name:      [ John Doe                       ] | iPhone 15 Pro    $999.00 |
| Email Address:  [ john@example.com (For receipt) ] | Anker Charger     $49.99 |
| Phone Number:   [ +1 555-0192                    ] | ------------------------ |
| Shipping Addr:  [ 123 Main Street, Suite 400     ] | Subtotal:       $1,048.99 |
| City / Country: [ New York         ] [ USA     v ] | Shipping:           FREE |
|                                                    | Total:          $1,048.99 |
| [ Continue to Payment -> ]                         |                          |
+----------------------------------------------------+--------------------------+
```

---

## Page 7: Customer Reviews Component & Submission

### 1. Concept & Rationale
Product reviews display average rating breakdown (5-star bar counts), customer review cards with verified buyer tags, and an email-verified submission modal. Anyone can submit a review, but backend validates `reviewer_email` against actual completed `orders` before approving.

### 2. ASCII Wireframe
```
+-------------------------------------------------------------------------------+
| CUSTOMER REVIEWS                                                              |
| Rating: 4.9 ★★★★★ (128 reviews)                      [ Write a Review ]      |
| 5 Star [====================================] 110                             |
| 4 Star [====] 12                                                              |
| 3 Star [=] 4                                                                  |
+-------------------------------------------------------------------------------+
| REVIEWS FEED                                                                  |
| ★★★★★  Verified Purchase — Sarah M.                                          |
| "Phenomenal build quality! The titanium finish is stunning."                 |
| Was this review helpful? (👍 24) (👎 1)                                       |
+-------------------------------------------------------------------------------+
```

---

## Page 8: Coupons & Promo System

### 1. Concept & Rationale
Integrated promo code entry point present on both Cart Drawer and Checkout pages. Allows users to validate discount codes (e.g. `IPHONE10`, `FREESHIP`). Displays inline validation feedback and real-time total recalculation.

### 2. Component Code Snippet
```tsx
// features/coupons/components/CouponInput.tsx
export function CouponInput() {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Promo code (e.g. SAVE10)"
        className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm uppercase font-mono tracking-wider text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      <button className="rounded-xl bg-surface border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-border/40 transition-colors">
        Apply
      </button>
    </div>
  );
}
```

---

## Page 9: Admin Auth & Dashboard Shell

### 1. Concept & Rationale
Separate authenticated app shell for store staff (`/admin/login` & `/admin/dashboard`). Distinct JWT auth isolated from maintenance auth. Modules include Overview metrics (Revenue, Orders, Low Stock Alerts), Product Catalog CRUD, Orders management, Customer list (derived from order emails), Reviews moderation, and Coupons management.

### 2. ASCII Wireframe
```
+-------------------------------------------------------------------------------+
| ADMIN LOGIN PAGE (/admin/login)                                               |
| [ Logo: iPhone Man Admin Portal ]                                             |
| Email Address: [ staff@iphoneman.com ]                                        |
| Password:      [ ******************* ]                                        |
| [ Sign In to Admin Dashboard -> ]                                             |
+-------------------------------------------------------------------------------+
| ADMIN DASHBOARD SHELL (/admin/dashboard)                                      |
| Sidebar:          | Overview Header: Welcome, Aisha (Super Admin)              |
| - Overview        +-------------------+ +-------------------+ +---------------+ |
| - Products        | Total Revenue     | | Total Orders      | | Low Stock     | |
| - Orders          | $148,920.00       | | 1,240 orders      | | 4 items alert | |
| - Customers       +-------------------+ +-------------------+ +---------------+ |
| - Reviews         | RECENT ORDERS TABLE                                       | |
| - Coupons         | #IPM-84920 | John D. | $1,048.99 | Shipped   | [ Detail ] | |
| - Maintenance     | #IPM-84919 | Sarah M.| $99.00    | Delivered | [ Detail ] | |
+-------------------+-----------------------------------------------------------+
```

---

## Design Rationale & Line Traceability Matrix

| Decision | Specification Traceability | Rationale |
| :--- | :--- | :--- |
| **Guest-Only Shopping** | INSTRUCTIONS.md §10, §14 | Beats ~70% conversion benchmarks by eliminating forced registration steps. |
| **Client-Side Cart/Wishlist** | INSTRUCTIONS.md §13, §15 | Uses Zustand `persist` in `localStorage`; no `users` database table required for shoppers. |
| **Apple Blue Accent (`#007AFF`)** | INSTRUCTIONS.md §27 | Reserved strictly for primary CTAs and interactive highlights to maintain visual calm. |
| **Western Arabic Numerals (`0-9`)** | INSTRUCTIONS.md §26.3 | Ensures fast scannability of prices and SKUs across English, Arabic, and Hebrew. |
| **Dual Admin & Maintenance Auth** | INSTRUCTIONS.md §13, §39.2 | Isolates e-commerce staff JWT auth from device repair staff auth (`maintenance_users`). |
