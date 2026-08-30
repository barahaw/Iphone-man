import { describe, expect, it } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/iphone_man_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-long-enough";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-long-enough";
process.env.MAINTENANCE_JWT_ACCESS_SECRET = "test-maintenance-access-secret-long";
process.env.MAINTENANCE_JWT_REFRESH_SECRET = "test-maintenance-refresh-secret-long";

describe("seeds/seed.ts production guard", () => {
  it("refuses to run when NODE_ENV is production", async () => {
    const { assertNotProduction } = await import("../../seeds/seed.js");
    expect(() => assertNotProduction("production")).toThrow(
      "Refusing to run seed script against NODE_ENV=production."
    );
  });

  it("allows development and test environments", async () => {
    const { assertNotProduction } = await import("../../seeds/seed.js");
    expect(() => assertNotProduction("development")).not.toThrow();
    expect(() => assertNotProduction("test")).not.toThrow();
  });
});
