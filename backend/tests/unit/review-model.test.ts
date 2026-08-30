import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type * as reviewModelModule from "../../src/models/review.model.js";

const mocks = vi.hoisted(() => ({
  query: vi.fn()
}));

vi.mock("../../src/config/db.js", () => ({
  pool: { query: mocks.query }
}));

const PUBLIC_COLUMNS = ["id", "product_id", "reviewer_name", "rating", "comment", "status", "created_at"] as const;

describe("reviewModel.listByProduct public projection", () => {
  let reviewModel: (typeof reviewModelModule)["reviewModel"];

  beforeAll(async () => {
    ({ reviewModel } = await import("../../src/models/review.model.js"));
  });

  beforeEach(() => {
    mocks.query.mockReset();
    mocks.query.mockResolvedValue({
      rows: [
        {
          id: 701,
          product_id: 101,
          reviewer_name: "Noor Haddad",
          rating: 5,
          comment: "Perfect fit.",
          status: "approved",
          created_at: new Date("2026-08-01T10:00:00Z")
        }
      ]
    });
  });

  it("selects explicit safe columns and never exposes reviewer_email", async () => {
    const rows = await reviewModel.listByProduct(101);

    expect(mocks.query).toHaveBeenCalledTimes(1);
    const [sql, params] = mocks.query.mock.calls[0];

    expect(sql).not.toContain("SELECT *");
    expect(sql).not.toContain("*");
    expect(sql).not.toContain("reviewer_email");
    for (const column of PUBLIC_COLUMNS) {
      expect(sql).toContain(column);
    }
    expect(sql).toContain("status = 'approved'");
    expect(params).toEqual([101]);

    expect(rows).toHaveLength(1);
    for (const row of rows) {
      expect(row).not.toHaveProperty("reviewer_email");
      expect(row).not.toHaveProperty("reviewerEmail");
    }
  });

  it("returns an empty list when no approved reviews exist", async () => {
    mocks.query.mockResolvedValue({ rows: [] });

    const rows = await reviewModel.listByProduct(999);

    expect(rows).toEqual([]);
  });
});
