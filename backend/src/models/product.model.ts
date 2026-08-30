import { pool, type DbClient } from "../config/db.js";
import type { Locale } from "../validators/common.validator.js";
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from "../validators/product.validator.js";

const PRODUCT_LOCALIZED_SELECT = `
      p.id, p.slug, p.brand_id, p.category_id, p.images,
      COALESCE(pt.name, p.name) AS name,
      COALESCE(pt.description, p.description) AS description,
      COALESCE(pt.specifications, p.specifications) AS specifications,
      p.compatible_devices,
      COALESCE(pt.warranty, p.warranty) AS warranty,
      p.stock_quantity, p.price, p.discount, p.rating, p.is_active, p.created_at, p.updated_at`;

export interface ProductRow {
  id: number;
  name: string;
  slug: string;
  brand_id: number;
  category_id: number;
  images: string[];
  description: string;
  specifications: Record<string, unknown>;
  compatible_devices: string[];
  warranty: string | null;
  stock_quantity: number;
  price: string;
  discount: string | null;
  rating: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ProductListResult {
  rows: ProductRow[];
  total: number;
}

export const productModel = {
  async list(filters: ProductListQuery, limit: number, offset: number): Promise<ProductListResult> {
    const locale: Locale = filters.locale ?? "en";
    const values: unknown[] = [];
    const where: string[] = ["p.is_active = true"];

    if (filters.q) {
      values.push(`%${filters.q}%`);
      where.push(`(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length})`);
    }

    if (filters.categoryId) {
      values.push(filters.categoryId);
      where.push(`p.category_id = $${values.length}`);
    }

    if (filters.brandId) {
      values.push(filters.brandId);
      where.push(`p.brand_id = $${values.length}`);
    }

    if (filters.minPrice !== undefined) {
      values.push(filters.minPrice);
      where.push(`p.price >= $${values.length}`);
    }

    if (filters.maxPrice !== undefined) {
      values.push(filters.maxPrice);
      where.push(`p.price <= $${values.length}`);
    }

    if (filters.inStock !== undefined) {
      where.push(filters.inStock ? "p.stock_quantity > 0" : "p.stock_quantity = 0");
    }

    // Decision: locale=en (explicit or default) keeps the original single-table
    // query — no translation JOIN is needed since the base columns ARE English.
    let joinSql = "";
    let selectSql = "p.*";
    if (locale !== "en") {
      values.push(locale);
      joinSql = `LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = $${values.length}`;
      selectSql = PRODUCT_LOCALIZED_SELECT;
    }

    const orderBy = {
      price_asc: "p.price ASC",
      price_desc: "p.price DESC",
      newest: "p.created_at DESC",
      rating: "p.rating DESC",
      popular: "p.rating DESC, p.created_at DESC"
    }[filters.sort ?? "newest"];

    const whereSql = where.join(" AND ");
    const countResult = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM products p ${joinSql} WHERE ${whereSql}`,
      values
    );

    values.push(limit, offset);
    const rows = await pool.query<ProductRow>(
      `SELECT ${selectSql} FROM products p ${joinSql} WHERE ${whereSql} ORDER BY ${orderBy} LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return {
      rows: rows.rows,
      total: Number(countResult.rows[0]?.total ?? 0)
    };
  },

  async findBySlug(slug: string, locale: Locale = "en"): Promise<ProductRow | null> {
    if (locale === "en") {
      const result = await pool.query<ProductRow>("SELECT * FROM products WHERE slug = $1 AND is_active = true", [slug]);
      return result.rows[0] ?? null;
    }

    const result = await pool.query<ProductRow>(
      `SELECT ${PRODUCT_LOCALIZED_SELECT}
      FROM products p
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = $2
      WHERE p.slug = $1 AND p.is_active = true`,
      [slug, locale]
    );
    return result.rows[0] ?? null;
  },

  async search(q: string, locale: Locale, limit: number, offset: number): Promise<ProductListResult> {
    const pattern = `%${q}%`;
    const localized = locale !== "en";
    const whereSql = `p.is_active = true
      AND (p.name ILIKE $1 OR p.description ILIKE $1 OR b.name ILIKE $1 OR c.name ILIKE $1)`;

    const count = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${whereSql}`,
      [pattern]
    );

    const values: unknown[] = localized ? [pattern, locale] : [pattern];
    const joinSql = localized
      ? `
      LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = $2`
      : "";

    values.push(limit, offset);
    const rows = await pool.query<ProductRow>(
      `SELECT ${localized ? PRODUCT_LOCALIZED_SELECT : "p.*"}
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN categories c ON c.id = p.category_id${joinSql}
      WHERE ${whereSql}
      ORDER BY p.rating DESC, p.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return {
      rows: rows.rows,
      total: Number(count.rows[0]?.total ?? 0)
    };
  },

  async findById(id: number, client: DbClient = pool): Promise<ProductRow | null> {
    const result = await client.query<ProductRow>("SELECT * FROM products WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  },

  async create(input: CreateProductInput, client: DbClient = pool): Promise<ProductRow> {
    const result = await client.query<ProductRow>(
      `INSERT INTO products (
        name, slug, brand_id, category_id, images, description, specifications,
        compatible_devices, warranty, stock_quantity, price, discount, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        input.name,
        input.slug,
        input.brandId,
        input.categoryId,
        input.images,
        input.description,
        input.specifications,
        input.compatibleDevices,
        input.warranty ?? null,
        input.stockQuantity,
        input.price,
        input.discount ?? null,
        input.isActive
      ]
    );
    return result.rows[0]!;
  },

  async update(id: number, input: UpdateProductInput, client: DbClient = pool): Promise<ProductRow | null> {
    const existing = await this.findById(id, client);
    if (!existing) {
      return null;
    }

    const result = await client.query<ProductRow>(
      `UPDATE products SET
        name = $2,
        slug = $3,
        brand_id = $4,
        category_id = $5,
        images = $6,
        description = $7,
        specifications = $8,
        compatible_devices = $9,
        warranty = $10,
        stock_quantity = $11,
        price = $12,
        discount = $13,
        is_active = $14,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        id,
        input.name ?? existing.name,
        input.slug ?? existing.slug,
        input.brandId ?? existing.brand_id,
        input.categoryId ?? existing.category_id,
        input.images ?? existing.images,
        input.description ?? existing.description,
        input.specifications ?? existing.specifications,
        input.compatibleDevices ?? existing.compatible_devices,
        input.warranty ?? existing.warranty,
        input.stockQuantity ?? existing.stock_quantity,
        input.price ?? Number(existing.price),
        input.discount ?? existing.discount,
        input.isActive ?? existing.is_active
      ]
    );

    return result.rows[0] ?? null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async replaceTranslations(productId: number, translations: CreateProductInput["translations"], client: DbClient): Promise<void> {
    await client.query("DELETE FROM product_translations WHERE product_id = $1", [productId]);

    for (const translation of translations) {
      await client.query(
        `INSERT INTO product_translations (product_id, locale, name, description, specifications, warranty)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          productId,
          translation.locale,
          translation.name,
          translation.description,
          translation.specifications,
          translation.warranty ?? null
        ]
      );
    }
  },

  async decrementStock(productId: number, variantId: number | null | undefined, quantity: number, client: DbClient): Promise<boolean> {
    if (variantId) {
      const variantResult = await client.query<{ id: number }>(
        `UPDATE product_variants
        SET stock_quantity = stock_quantity - $1
        WHERE id = $2 AND product_id = $3 AND stock_quantity >= $1
        RETURNING id`,
        [quantity, variantId, productId]
      );

      if (variantResult.rows.length === 0) {
        return false;
      }
    }

    const productResult = await client.query<{ id: number }>(
      `UPDATE products
      SET stock_quantity = stock_quantity - $1, updated_at = NOW()
      WHERE id = $2 AND stock_quantity >= $1
      RETURNING id`,
      [quantity, productId]
    );

    return productResult.rows.length > 0;
  },

  async incrementStock(productId: number, variantId: number | null | undefined, quantity: number, client: DbClient): Promise<void> {
    if (variantId) {
      await client.query(
        `UPDATE product_variants
        SET stock_quantity = stock_quantity + $1
        WHERE id = $2 AND product_id = $3`,
        [quantity, variantId, productId]
      );
    }

    await client.query(
      `UPDATE products
      SET stock_quantity = stock_quantity + $1, updated_at = NOW()
      WHERE id = $2`,
      [quantity, productId]
    );
  }
};

