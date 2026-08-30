# RTL_NOTES.md — Right-To-Left (RTL) & i18n Layout Specification

**Specification Source:** [INSTRUCTIONS.md](file:///c:/Users/HP/Desktop/iphone-man/INSTRUCTIONS.md) (Section 36: Internationalization & RTL Support)

---

## 1. Executive Principles

Arabic (`ar`) and Hebrew (`he`) are both Right-to-Left (RTL) languages. In iPhone Man v1, RTL is a **first-class layout mode**, not an inline CSS hack or reversed transform.

1. **Root Configuration:** `html[dir="rtl"]` is applied dynamically based on the active locale route (`/ar/...`, `/he/...`). `html[dir="ltr"]` is applied for `/en/...`.
2. **Logical CSS Properties:** Physical spacing utilities like `ml-4`, `mr-2`, `pl-6`, `text-left` are strictly avoided in favor of Tailwind logical properties:
   - `ms-4` (`margin-inline-start`) / `me-2` (`margin-inline-end`)
   - `ps-6` (`padding-inline-start`) / `pe-4` (`padding-inline-end`)
   - `text-start` / `text-end`
3. **Numerals Isolation:** Prices, quantities, SKUs, model numbers, and technical specifications (e.g. `256GB`, `6.7"`, `$999.00`) remain in **Western Arabic Numerals (`0-9`)** across all three locales (INSTRUCTIONS.md §26.3). Text direction isolation using `<bdi>` or `unicode-bidi: isolate` prevents text scrambling.

---

## 2. Icon Behavior & Mirroring Rules

Not all icons mirror in RTL mode! Per INSTRUCTIONS.md §36.3, direction-based icons mirror, while symmetrical or brand icons stay unmirrored:

| Icon Category | Examples | LTR Behavior | RTL Behavior | Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **Directional Navigation** | ArrowRight, ArrowLeft, ChevronRight, BackButton | Pointing Right | Pointing Left | `rtl:rotate-180` |
| **Progress / Wizard Flow** | Step 1 → Step 2 → Step 3 | Left-to-Right | Right-to-Left | Flex-row-reverse under `dir="rtl"` |
| **Non-Directional Actions** | Search, ShoppingBag, Heart, Star, Lock, Filter | Standard | Standard (Unchanged) | No rotation applied |
| **Brand Logos** | Apple, Samsung, Nothing, Anker, iPhone Man Logo | Standard | Standard (Unchanged) | Fixed orientation |

---

## 3. Per-Page RTL Visual & Structural Behavior

### 1. Storefront Header & Navigation
- **LTR (`en`):** [Logo] -> [Nav Links] ---------------- [Search Bar] -> [Wishlist] [Cart] [Locale Switcher]
- **RTL (`ar`/`he`):** [Locale Switcher] [Cart] [Wishlist] [Search Bar] ---------------- [Nav Links] <- [Logo]
- **Drawer Slideovers:** Cart and Mobile Navigation drawers slide out from the **Right** in LTR, and from the **Left** in RTL (`rtl:left-0 rtl:right-auto`).

### 2. Product Listing Page (PLP)
- **Filters Sidebar:** Positioned on the **Left** in LTR, positioned on the **Right** in RTL.
- **Product Grid Flow:** Fills top-right first, proceeding right-to-left in RTL (`direction: rtl`).
- **Sort Dropdown:** Aligns to the start of the filter row (top-right in RTL).

### 3. Product Detail Page (PDP)
- **Desktop 2-Column Grid:**
  - **LTR (`en`):** [Gallery Column (Left)] | [Product Specs & Add-to-Cart (Right)]
  - **RTL (`ar`/`he`):** [Product Specs & Add-to-Cart (Left)] | [Gallery Column (Right)]
- **Breadcrumbs:** `Home > Smartphones > iPhone 15 Pro` becomes `الرئيسية < الهواتف الذكية < آيفون 15 برو` with flipped chevron separators (`rtl:rotate-180`).
- **Sticky Mobile Bar:** Action buttons align to the inline-end (`ps-4`), price summary aligns to inline-start (`pe-4`).

### 4. Cart & Guest Checkout Flow
- **Step Indicator:** Steps (1. Shipping -> 2. Payment -> 3. Confirmation) read Right-to-Left in Arabic/Hebrew.
- **Address & Payment Forms:** Labels align `text-start` (right-aligned in RTL). Country/City selects and input icons anchor to `inline-start`.
- **Order Summary Card:** Price labels align `text-start`, values align `text-end`.

### 5. Admin Dashboard Shell
- **Sidebar Navigation:** Anchored to the **Left** side of screen in LTR, anchored to the **Right** side in RTL.
- **Data Tables:** Columns flow Right-to-Left. Action buttons (Edit, Delete, View) anchor to the inline-start column.

---

## 4. Typography & Bidi Code Snippet Examples

### Tailwind Dynamic RTL Class Structure:
```tsx
// Example: Product Card Header with Bidi Isolation for Price & Model
export function ProductCardHeader({ title, price, brand }: { title: string; price: number; brand: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-start">
      <h3 className="font-semibold text-lg text-foreground truncate">
        {/* Isolated title prevents mixed RTL/LTR scrambling */}
        <bdi>{title}</bdi>
      </h3>
      <span className="font-bold text-accent text-base whitespace-nowrap">
        {/* Numerals isolated */}
        <bdi>${price.toFixed(2)}</bdi>
      </span>
    </div>
  );
}
```

### Logical Spacing Reference Table:
| Legacy Physical Class | Modern RTL-Ready Logical Class | Description |
| :--- | :--- | :--- |
| `ml-4` | `ms-4` | Margin start (Left in LTR, Right in RTL) |
| `mr-4` | `me-4` | Margin end (Right in LTR, Left in RTL) |
| `pl-6` | `ps-6` | Padding start (Left in LTR, Right in RTL) |
| `pr-6` | `pe-6` | Padding end (Right in LTR, Left in RTL) |
| `text-left` | `text-start` | Text alignment matching reading direction |
| `text-right` | `text-end` | Text alignment opposite reading direction |
| `left-0` | `start-0` | Absolute position start |
| `right-0` | `end-0` | Absolute position end |
