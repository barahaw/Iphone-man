import { pool, type DbClient } from "../config/db.js";
import type { Locale } from "../validators/common.validator.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "../validators/category.validator.js";

export const categoryModel = {
  async list(locale: Locale = "en") {
    if (locale === "en") {
      const result = await pool.query("SELECT * FROM categories ORDER BY display_order ASC, name ASC");
      return result.rows;
    }

    const result = await pool.query(
      `SELECT c.id, c.slug, c.parent_id, c.display_order, c.created_at, c.updated_at,
        COALESCE(ct.name, c.name) AS name,
        COALESCE(ct.description, c.description) AS description
      FROM categories c
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = $1
      ORDER BY c.display_order ASC, name ASC`,
      [locale]
    );
    return result.rows;
  },

  async create(input: CreateCategoryInput, client: DbClient = pool) {
    const result = await client.query(
      `INSERT INTO categories (name, slug, parent_id, display_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [input.name, input.slug, input.parentId ?? null, input.displayOrder]
    );
    return result.rows[0];
  },

  async update(id: number, input: UpdateCategoryInput, client: DbClient = pool) {
    const current = await client.query("SELECT * FROM categories WHERE id = $1", [id]);
    const row = current.rows[0];
    if (!row) {
      return null;
    }

    const result = await client.query(
      `UPDATE categories
      SET name = $2, slug = $3, parent_id = $4, display_order = $5, updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [id, input.name ?? row.name, input.slug ?? row.slug, input.parentId ?? row.parent_id, input.displayOrder ?? row.display_order]
    );
    return result.rows[0] ?? null;
  },

  async delete(id: number) {
    const result = await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async replaceTranslations(categoryId: number, translations: CreateCategoryInput["translations"], client: DbClient) {
    await client.query("DELETE FROM category_translations WHERE category_id = $1", [categoryId]);

    for (const translation of translations) {
      await client.query(
        `INSERT INTO category_translations (category_id, locale, name, description)
        VALUES ($1, $2, $3, $4)`,
        [categoryId, translation.locale, translation.name, translation.description ?? null]
      );
    }
  }
};

