import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type * as productModelModule from "../../src/models/product.model.js";
import type { ProductListQuery } from "../../src/validators/product.validator.js";

const mocks = vi.hoisted(() => ({
  query: vi.fn()
}));

vi.mock("../../src/config/db.js", () => ({
  pool: { query: mocks.query }
}));

describe("productModel locale-aware reads", () => {
  let productModel: (typeof productModelModule)["productModel"];

  beforeAll(async () => {
    ({ productModel } = await import("../../src/models/product.model.js"));
  });

  beforeEach(() => {
    mocks.query.mockReset();
    mocks.query.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  const listQuery = (overrides: Partial<ProductListQuery> = {}) => ({ ...overrides }) as ProductListQuery;

  describe("list", () => {
    it("joins product_translations and uses COALESCE fallbacks when locale=ar", async () => {
      await productModel.list(listQuery({ locale: "ar" }), 20, 0);

      expect(mocks.query).toHaveBeenCalledTimes(2);
      const [countSql] = mocks.query.mock.calls[0];
      expect(countSql).toContain("LEFT JOIN product_translations");

      const [rowsSql, rowsParams] = mocks.query.mock.calls[1];
      expect(rowsSql).toContain("LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale =");
      expect(rowsSql).toContain("COALESCE(pt.name, p.name)");
      expect(rowsSql).toContain("COALESCE(pt.description, p.description)");
      expect(rowsSql).toContain("COALESCE(pt.specifications, p.specifications)");
      expect(rowsSql).toContain("COALESCE(pt.warranty, p.warranty)");
      expect(rowsSql).not.toContain("'ar'");
      expect(rowsParams).toContain("ar");
    });

    it("keeps the base English query when locale=en is explicit", async () => {
      await productModel.list(listQuery({ locale: "en" }), 20, 0);

      expect(mocks.query).toHaveBeenCalledTimes(2);
      for (const call of mocks.query.mock.calls) {
        const [sql, params] = call;
        expect(sql).not.toContain("product_translations");
        expect(sql).not.toContain("COALESCE");
        expect(params).not.toContain("en");
      }
    });

    it("does not break when locale is absent (defaults to English base columns)", async () => {
      const result = await productModel.list(listQuery(), 20, 0);

      expect(result.rows).toEqual([]);
      const [, rowsParams] = mocks.query.mock.calls[1];
      expect(rowsParams).toEqual([20, 0]);
    });

    it("passes the locale as a bind parameter positioned after dynamic filters", async () => {
      await productModel.list(listQuery({ q: "case", categoryId: 3, locale: "he" }), 20, 0);

      const [, rowsParams] = mocks.query.mock.calls[1];
      expect(rowsParams).toEqual(["%case%", 3, "he", 20, 0]);

      const [rowsSql] = mocks.query.mock.calls[1];
      expect(rowsSql).toContain("pt.locale = $3");
    });
  });

  describe("findBySlug", () => {
    it("joins translations and binds the locale for non-English locales", async () => {
      await productModel.findBySlug("smartphones-essential-1", "ar");

      expect(mocks.query).toHaveBeenCalledTimes(1);
      const [sql, params] = mocks.query.mock.calls[0];
      expect(sql).toContain("LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = $2");
      expect(sql).toContain("COALESCE(pt.name, p.name)");
      expect(sql).toContain("COALESCE(pt.description, p.description)");
      expect(sql).toContain("COALESCE(pt.specifications, p.specifications)");
      expect(sql).toContain("COALESCE(pt.warranty, p.warranty)");
      expect(sql).not.toContain("'ar'");
      expect(params).toEqual(["smartphones-essential-1", "ar"]);
    });

    it("returns the base row unchanged for locale=en", async () => {
      mocks.query.mockResolvedValue({
        rows: [{ id: 1, slug: "smartphones-essential-1", name: "Smartphones Essential 1" }]
      });

      const product = await productModel.findBySlug("smartphones-essential-1", "en");

      expect(mocks.query).toHaveBeenCalledWith(
        "SELECT * FROM products WHERE slug = $1 AND is_active = true",
        ["smartphones-essential-1"]
      );
      expect(product?.name).toBe("Smartphones Essential 1");
    });

    it("defaults to the base English query when locale is omitted", async () => {
      await productModel.findBySlug("smartphones-essential-1");

      const [sql, params] = mocks.query.mock.calls[0];
      expect(sql).toBe("SELECT * FROM products WHERE slug = $1 AND is_active = true");
      expect(params).toHaveLength(1);
    });
  });

  describe("search", () => {
    it("joins translations with COALESCE and binds locale for locale=ar", async () => {
      await productModel.search("case", "ar", 20, 0);

      expect(mocks.query).toHaveBeenCalledTimes(2);
      const [rowsSql, rowsParams] = mocks.query.mock.calls[1];
      expect(rowsSql).toContain("LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = $2");
      expect(rowsSql).toContain("COALESCE(pt.name, p.name)");
      expect(rowsSql).toContain("COALESCE(pt.description, p.description)");
      expect(rowsSql).not.toContain("'ar'");
      expect(rowsParams).toEqual(["%case%", "ar", 20, 0]);
    });

    it("searches without the translation join for locale=en", async () => {
      await productModel.search("case", "en", 20, 0);

      const [rowsSql, rowsParams] = mocks.query.mock.calls[1];
      expect(rowsSql).not.toContain("product_translations");
      expect(rowsSql).not.toContain("COALESCE");
      expect(rowsParams).toEqual(["%case%", 20, 0]);
    });
  });
});
