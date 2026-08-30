import bcrypt from "bcrypt";
import { pool } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function assertNotProduction(nodeEnv: string): void {
  if (nodeEnv === "production") {
    throw new Error("Refusing to run seed script against NODE_ENV=production.");
  }
}

const categories = [
  ["Smartphones", "smartphones", "الهواتف الذكية", "סמארטפונים"],
  ["Smartwatches", "smartwatches", "الساعات الذكية", "שעונים חכמים"],
  ["Tablets", "tablets", "الأجهزة اللوحية", "טאבלטים"],
  ["Wireless Earbuds", "wireless-earbuds", "سماعات أذن لاسلكية", "אוזניות אלחוטיות"],
  ["Headphones", "headphones", "سماعات رأس", "אוזניות קשת"],
  ["Chargers", "chargers", "الشواحن", "מטענים"],
  ["Charging Cables", "charging-cables", "كوابل الشحن", "כבלי טעינה"],
  ["Phone Cases", "phone-cases", "أغطية الهواتف", "כיסויים לטלפון"],
  ["Screen Protectors", "screen-protectors", "واقيات الشاشة", "מגני מסך"],
  ["Power Banks", "power-banks", "بطاريات متنقلة", "סוללות ניידות"],
  ["Phone Holders", "phone-holders", "حوامل الهواتف", "מחזיקים לטלפון"],
  ["Smart Home Accessories", "smart-home-accessories", "ملحقات المنزل الذكي", "אביזרי בית חכם"],
  ["Gaming Accessories", "gaming-accessories", "ملحقات الألعاب", "אביזרי גיימינג"],
  ["Mobile Accessories", "mobile-accessories", "ملحقات الموبايل", "אביזרי מובייל"]
] as const;

const brands = [
  ["Apple", "apple", "Premium devices and accessories.", "أجهزة وملحقات فاخرة.", "מכשירים ואביזרים פרימיום."],
  ["Samsung", "samsung", "Galaxy phones, tablets, and wearables.", "هواتف وأجهزة Galaxy.", "טלפונים, טאבלטים ומוצרים לבישים של Galaxy."],
  ["Anker", "anker", "Reliable charging and power accessories.", "شواحن وملحقات طاقة موثوقة.", "אביזרי טעינה ואנרגיה אמינים."],
  ["Nothing", "nothing", "Minimal mobile technology with bold design.", "تقنية موبايل بتصميم جريء وبسيط.", "טכנולוגיית מובייל מינימלית בעיצוב נועז."]
] as const;

async function seed(): Promise<void> {
  assertNotProduction(env.NODE_ENV);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash("Admin12345", env.BCRYPT_ROUNDS);
    await client.query(
      `INSERT INTO admin_users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING`,
      ["Admin Aisha", "admin@iphoneman.test", passwordHash, "super_admin"]
    );

    const maintenancePasswordHash = await bcrypt.hash("Maintain123", env.BCRYPT_ROUNDS);
    await client.query(
      `INSERT INTO maintenance_users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING`,
      ["Maintenance Admin", "repair.admin@iphoneman.test", maintenancePasswordHash, "admin"]
    );
    await client.query(
      `INSERT INTO maintenance_users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING`,
      ["Rashid the Repair Tech", "repair.worker@iphoneman.test", maintenancePasswordHash, "worker"]
    );

    const brandIds = new Map<string, number>();
    for (const [name, slug, enDescription, arDescription, heDescription] of brands) {
      const brand = await client.query<{ id: number }>(
        `INSERT INTO brands (name, slug, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id`,
        [name, slug, enDescription]
      );
      const brandId = brand.rows[0]!.id;
      brandIds.set(slug, brandId);

      const translations = [
        ["en", name, enDescription],
        ["ar", name, arDescription],
        ["he", name, heDescription]
      ] as const;

      for (const [locale, translatedName, description] of translations) {
        await client.query(
          `INSERT INTO brand_translations (brand_id, locale, name, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (brand_id, locale) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
          [brandId, locale, translatedName, description]
        );
      }
    }

    const categoryIds = new Map<string, number>();
    for (const [index, category] of categories.entries()) {
      const [name, slug, arName, heName] = category;
      const created = await client.query<{ id: number }>(
        `INSERT INTO categories (name, slug, display_order)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, display_order = EXCLUDED.display_order
        RETURNING id`,
        [name, slug, index + 1]
      );
      const categoryId = created.rows[0]!.id;
      categoryIds.set(slug, categoryId);

      const translations = [
        ["en", name, `${name} curated for iPhone Man shoppers.`],
        ["ar", arName, `${arName} مختارة بعناية لمتجر iPhone Man.`],
        ["he", heName, `${heName} שנבחרו בקפידה לחנות iPhone Man.`]
      ] as const;

      for (const [locale, translatedName, description] of translations) {
        await client.query(
          `INSERT INTO category_translations (category_id, locale, name, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (category_id, locale) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
          [categoryId, locale, translatedName, description]
        );
      }
    }

    for (const [index, category] of categories.entries()) {
      const [categoryName, categorySlug] = category;
      const brandId = brandIds.get(index % 2 === 0 ? "apple" : "anker")!;
      const categoryId = categoryIds.get(categorySlug)!;
      const productName = `${categoryName} Essential ${index + 1}`;
      const productSlug = `${categorySlug}-essential-${index + 1}`;

      const product = await client.query<{ id: number }>(
        `INSERT INTO products (
          name, slug, brand_id, category_id, images, description, specifications,
          compatible_devices, warranty, stock_quantity, price, discount, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id`,
        [
          productName,
          productSlug,
          brandId,
          categoryId,
          [`https://example.com/images/${productSlug}.jpg`],
          `A reliable ${categoryName.toLowerCase()} pick for everyday use.`,
          { category: categorySlug, sample: true },
          ["iPhone 15", "iPhone 15 Pro", "Samsung Galaxy S24"],
          "12 months manufacturer warranty",
          25 + index,
          49 + index * 10,
          null
        ]
      );

      const productId = product.rows[0]!.id;
      const translations = [
        ["en", productName, `A reliable ${categoryName.toLowerCase()} pick for everyday use.`],
        ["ar", `${categoryName} أساسي ${index + 1}`, `خيار موثوق من فئة ${categoryName} للاستخدام اليومي.`],
        ["he", `${categoryName} בסיסי ${index + 1}`, `בחירה אמינה בקטגוריית ${categoryName} לשימוש יומיומי.`]
      ] as const;

      for (const [locale, name, description] of translations) {
        await client.query(
          `INSERT INTO product_translations (product_id, locale, name, description, specifications, warranty)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (product_id, locale)
          DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, specifications = EXCLUDED.specifications, warranty = EXCLUDED.warranty`,
          [productId, locale, name, description, { category: categorySlug }, "12 months manufacturer warranty"]
        );
      }
    }

    await client.query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_value, expires_at, usage_limit)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '90 days', $5)
      ON CONFLICT (code) DO NOTHING`,
      ["WELCOME10", "percentage", 10, 50, 500]
    );

    const existingJob = await client.query("SELECT id FROM maintenance_jobs LIMIT 1");
    if (existingJob.rows.length === 0) {
      const maintenanceWorker = await client.query<{ id: number }>(
        "SELECT id FROM maintenance_users WHERE email = $1",
        ["repair.worker@iphoneman.test"]
      );

      if (maintenanceWorker.rows[0]) {
        await client.query(
          `INSERT INTO maintenance_jobs (worker_id, device_type, part_type, cost_price, customer_price, percentage, net_amount, net_profit)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [maintenanceWorker.rows[0].id, "iPhone 13", "Screen", 45, 90, 20, 45, 36]
        );
        await client.query(
          `INSERT INTO maintenance_jobs (worker_id, device_type, part_type, cost_price, customer_price, percentage, net_amount, net_profit)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [maintenanceWorker.rows[0].id, "Samsung Galaxy S23", "Battery", 25, 70, 15, 45, 38.25]
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

const isMain =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  seed().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

