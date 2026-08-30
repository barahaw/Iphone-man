import { pool, type DbClient } from "../config/db.js";
import type { Locale } from "../validators/common.validator.js";
import type { CreateBrandInput, UpdateBrandInput } from "../validators/brand.validator.js";

export const brandModel = {
  async list(locale: Locale = "en") {
    if (locale === "en") {
      const result = await pool.query("SELECT * FROM brands ORDER BY name ASC");
      return result.rows;
    }

    const result = await pool.query(
      `SELECT b.id, b.slug, b.logo_url, b.created_at, b.updated_at,
        COALESCE(bt.name, b.name) AS name,
        COALESCE(bt.description, b.description) AS description
      FROM brands b
      LEFT JOIN brand_translations bt ON bt.brand_id = b.id AND bt.locale = $1
      ORDER BY name ASC`,
      [locale]
    );
    return result.rows;
  },

  async create(input: CreateBrandInput, client: DbClient = pool) {
    const result = await client.query(
      `INSERT INTO brands (name, slug, logo_url, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [input.name, input.slug, input.logoUrl ?? null, input.description ?? null]
    );
    return result.rows[0];
  },

  async update(id: number, input: UpdateBrandInput, client: DbClient = pool) {
    const current = await client.query("SELECT * FROM brands WHERE id = $1", [id]);
    const row = current.rows[0];
    if (!row) {
      return null;
    }

    const result = await client.query(
      `UPDATE brands
      SET name = $2, slug = $3, logo_url = $4, description = $5, updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [id, input.name ?? row.name, input.slug ?? row.slug, input.logoUrl ?? row.logo_url, input.description ?? row.description]
    );
    return result.rows[0] ?? null;
  },

  async delete(id: number) {
    const result = await pool.query("DELETE FROM brands WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async replaceTranslations(brandId: number, translations: CreateBrandInput["translations"], client: DbClient) {
    await client.query("DELETE FROM brand_translations WHERE brand_id = $1", [brandId]);

    for (const translation of translations) {
      await client.query(
        `INSERT INTO brand_translations (brand_id, locale, name, description)
        VALUES ($1, $2, $3, $4)`,
        [brandId, translation.locale, translation.name, translation.description ?? null]
      );
    }
  }
};

