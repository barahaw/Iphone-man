import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type * as brandModelModule from "../../src/models/brand.model.js";
import type * as categoryModelModule from "../../src/models/category.model.js";

const mocks = vi.hoisted(() => ({
  query: vi.fn()
}));

vi.mock("../../src/config/db.js", () => ({
  pool: { query: mocks.query }
}));

describe("category/brand models locale-aware list", () => {
  let categoryModel: (typeof categoryModelModule)["categoryModel"];
  let brandModel: (typeof brandModelModule)["brandModel"];

  beforeAll(async () => {
    ({ categoryModel } = await import("../../src/models/category.model.js"));
    ({ brandModel } = await import("../../src/models/brand.model.js"));
  });

  beforeEach(() => {
    mocks.query.mockReset();
    mocks.query.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  it("categoryModel.list joins category_translations with COALESCE for locale=he", async () => {
    await categoryModel.list("he");

    expect(mocks.query).toHaveBeenCalledTimes(1);
    const [sql, params] = mocks.query.mock.calls[0];
    expect(sql).toContain("LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = $1");
    expect(sql).toContain("COALESCE(ct.name, c.name)");
    expect(sql).toContain("COALESCE(ct.description, c.description)");
    expect(sql).not.toContain("'he'");
    expect(params).toEqual(["he"]);
  });

  it("categoryModel.list keeps the base query by default", async () => {
    await categoryModel.list();

    const [sql, params] = mocks.query.mock.calls[0];
    expect(sql).toBe("SELECT * FROM categories ORDER BY display_order ASC, name ASC");
    expect(params ?? []).toHaveLength(0);
  });

  it("brandModel.list joins brand_translations with COALESCE for locale=he", async () => {
    await brandModel.list("he");

    expect(mocks.query).toHaveBeenCalledTimes(1);
    const [sql, params] = mocks.query.mock.calls[0];
    expect(sql).toContain("LEFT JOIN brand_translations bt ON bt.brand_id = b.id AND bt.locale = $1");
    expect(sql).toContain("COALESCE(bt.name, b.name)");
    expect(sql).toContain("COALESCE(bt.description, b.description)");
    expect(sql).not.toContain("'he'");
    expect(params).toEqual(["he"]);
  });

  it("brandModel.list keeps the base query when locale=en is explicit", async () => {
    await brandModel.list("en");

    const [sql, params] = mocks.query.mock.calls[0];
    expect(sql).toBe("SELECT * FROM brands ORDER BY name ASC");
    expect(params ?? []).toHaveLength(0);
  });
});
