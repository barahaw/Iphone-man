# DESIGN_SYSTEM.md — iPhone Man Brand & Design System Tokens

**Specification Sources:** 
- [INSTRUCTIONS.md](file:///c:/Users/HP/Desktop/iphone-man/INSTRUCTIONS.md)
- [Official iPhone Man Brand Logo](file:///c:/Users/HP/Desktop/iphone-man/Frontend/public/logo.jpg)
- Brand Guidelines & Visual Identity Standards

---

## 1. Official Brand Identity & Logo

iPhone Man is a **single-vendor premium mobile retailer** built around a sleek, luxury monochrome Apple-inspired aesthetic.

- **Primary Logo Mark:** Official Gentleman Mustache + Apple Silhouette Logo ([logo.jpg](file:///c:/Users/HP/Desktop/iphone-man/Frontend/public/logo.jpg)).
- **Core Palette:** Matte Black (`#0F0F11`), Charcoal Slate (`#212529`), Pure White (`#FFFFFF`), Soft Neutral Surface (`#F8F9FA`).
- **Accent Tokens:** Restrained system status colors — In-Stock (`#16A34A`), Low Stock (`#F59E0B`), Sale/Error (`#DC2626`).

---

## 2. Palette & Theme Definitions

```css
@theme {
  --color-background: #f8f9fa;
  --color-surface: #ffffff;
  --color-surface-hover: #f1f3f5;
  --color-foreground: #0f0f11;
  --color-muted-foreground: #6c757d;
  --color-border: #e9ecef;

  /* Primary Brand Accent derived from official logo */
  --color-accent: #0f0f11;
  --color-accent-hover: #212529;
  --color-accent-soft: rgba(15, 15, 17, 0.08);

  /* Status Tokens */
  --color-success: #16a34a;
  --color-warning: #f59e0b;
  --color-destructive: #dc2626;

  /* Layered Elevation Shadows */
  --shadow-soft-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-soft-md: 0 8px 24px rgba(0, 0, 0, 0.06);
  --shadow-soft-lg: 0 18px 45px rgba(0, 0, 0, 0.1);
}
```

---

## 3. Typography & Multi-Locale System

- **English (`en`):** `Inter`, `-apple-system`, `SF Pro Display`, `Segoe UI`, `Roboto`, `sans-serif`
- **Arabic (`ar`):** `IBM Plex Sans Arabic`, `Noto Sans Arabic`, `Segoe UI`, `sans-serif` (Line height: 1.65)
- **Hebrew (`he`):** `Noto Sans Hebrew`, `Assistant`, `Segoe UI`, `sans-serif` (Line height: 1.6)
- **Currency & Numerals:** Western Arabic Numerals (`0-9`) with the Israeli Shekel symbol (`₪`).

---

## 4. Touch Targets & Safe Area Guidelines

- **Minimum Interactive Size:** 44x44pt on all buttons, links, inputs, and controls.
- **Dynamic Inset:** Actions inset by 16px from viewport edges.
- **RTL Logical Properties:** `padding-inline-start`, `margin-inline-end`, `text-start`.
