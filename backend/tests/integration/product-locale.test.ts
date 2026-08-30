import request from "supertest";
import type { Express } from "express";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/iphone_man_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-long-enough";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-long-enough";
process.env.MAINTENANCE_JWT_ACCESS_SECRET = "test-maintenance-access-secret-long";
process.env.MAINTENANCE_JWT_REFRESH_SECRET = "test-maintenance-refresh-secret-long";

const findBySlugMock = vi.hoisted(() => vi.fn());
const categoryListMock = vi.hoisted(() => vi.fn());
const brandListMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/services/product.service.js", () => ({
  productService: {
    list: vi.fn(),
    findBySlug: findBySlugMock,
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock("../../src/services/category.service.js", () => ({
  categoryService: {
    list: categoryListMock,
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock("../../src/services/brand.service.js", () => ({
  brandService: {
    list: brandListMock,
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

const baseProduct = {
  id: 1,
  slug: "smartphones-essential-1",
  brand_id: 1,
  category_id: 1,
  images: ["https://example.com/images/smartphones-essential-1.jpg"],
  specifications: { category: "smartphones" },
  compatible_devices: ["iPhone 15"],
  warranty: "12 months manufacturer warranty",
  stock_quantity: 25,
  price: "49.00",
  discount: null,
  rating: "0",
  is_active: true,
  created_at: "2026-08-01T10:00:00.000Z",
  updated_at: "2026-08-01T10:00:00.000Z"
};

const englishProduct = {
  ...baseProduct,
  name: "Smartphones Essential 1",
  description: "A reliable smartphones pick for everyday use."
};

const arabicProduct = {
  ...baseProduct,
  name: "الهواتف الذكية أساسي 1",
  description: "خيار موثوق من فئة Smartphones للاستخدام اليومي."
};

describe("GET /products/{slug} locale handling", () => {
  let app: Express;

  beforeAll(async () => {
    app = (await import("../../src/app.js")).app;
  });

  beforeEach(() => {
    findBySlugMock.mockReset();
    findBySlugMock.mockResolvedValue(englishProduct);
    categoryListMock.mockReset().mockResolvedValue([]);
    brandListMock.mockReset().mockResolvedValue([]);
  });

  it("returns the fully translated Arabic content when ?locale=ar and the translation is complete", async () => {
    findBySlugMock.mockResolvedValue(arabicProduct);

    const response = await request(app).get("/api/v1/products/smartphones-essential-1?locale=ar").expect(200);

    expect(findBySlugMock).toHaveBeenCalledWith("smartphones-essential-1", "ar");
    expect(response.body.data.name).toBe("الهواتف الذكية أساسي 1");
    expect(response.body.data.description).toBe("خيار موثوق من فئة Smartphones للاستخدام اليومي.");
  });

  it("falls back per field: Arabic name with missing Arabic description returns English description only", async () => {
    findBySlugMock.mockResolvedValue({
      ...baseProduct,
      name: "الهواتف الذكية أساسي 1",
      description: englishProduct.description
    });

    const response = await request(app).get("/api/v1/products/smartphones-essential-1?locale=ar").expect(200);

    expect(findBySlugMock).toHaveBeenCalledWith("smartphones-essential-1", "ar");
    expect(response.body.data.name).toBe("الهواتف الذكية أساسي 1");
    expect(response.body.data.description).toBe("A reliable smartphones pick for everyday use.");
  });

  it("regression guard: no locale keeps returning the base English content", async () => {
    const response = await request(app).get("/api/v1/products/smartphones-essential-1").expect(200);

    expect(findBySlugMock).toHaveBeenCalledWith("smartphones-essential-1", "en");
    expect(response.body.data.name).toBe("Smartphones Essential 1");
    expect(response.body.data.description).toBe("A reliable smartphones pick for everyday use.");
  });

  it("regression guard: explicit locale=en behaves exactly like before this change", async () => {
    const response = await request(app).get("/api/v1/products/smartphones-essential-1?locale=en").expect(200);

    expect(findBySlugMock).toHaveBeenCalledWith("smartphones-essential-1", "en");
    expect(response.body.data.name).toBe("Smartphones Essential 1");
  });

  it("rejects unsupported locales with a validation error", async () => {
    const response = await request(app).get("/api/v1/products/smartphones-essential-1?locale=fr").expect(400);

    expect(findBySlugMock).not.toHaveBeenCalled();
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /categories and GET /brands locale handling", () => {
  let app: Express;

  beforeAll(async () => {
    app = (await import("../../src/app.js")).app;
  });

  beforeEach(() => {
    categoryListMock.mockReset().mockResolvedValue([]);
    brandListMock.mockReset().mockResolvedValue([]);
  });

  const hebrewCategories = [
    { id: 1, name: "סמארטפונים", slug: "smartphones", parent_id: null, display_order: 1 },
    { id: 2, name: "שעונים חכמים", slug: "smartwatches", parent_id: null, display_order: 2 }
  ];

  const hebrewBrands = [{ id: 1, name: "Apple", slug: "apple", logo_url: null, description: "מכשירים ואביזרים פרימיום." }];

  it("returns Hebrew categories when ?locale=he", async () => {
    categoryListMock.mockResolvedValue(hebrewCategories);

    const response = await request(app).get("/api/v1/categories?locale=he").expect(200);

    expect(categoryListMock).toHaveBeenCalledWith("he");
    expect(response.body.data[0].name).toBe("סמארטפונים");
    expect(response.body.data[1].name).toBe("שעונים חכמים");
  });

  it("defaults categories to English when no locale is sent", async () => {
    categoryListMock.mockResolvedValue([{ id: 1, name: "Smartphones", slug: "smartphones" }]);

    const response = await request(app).get("/api/v1/categories").expect(200);

    expect(categoryListMock).toHaveBeenCalledWith("en");
    expect(response.body.data[0].name).toBe("Smartphones");
  });

  it("returns Hebrew brands when ?locale=he", async () => {
    brandListMock.mockResolvedValue(hebrewBrands);

    const response = await request(app).get("/api/v1/brands?locale=he").expect(200);

    expect(brandListMock).toHaveBeenCalledWith("he");
    expect(response.body.data[0].description).toBe("מכשירים ואביזרים פרימיום.");
  });

  it("rejects an invalid locale on the brands listing", async () => {
    const response = await request(app).get("/api/v1/brands?locale=de").expect(400);

    expect(brandListMock).not.toHaveBeenCalled();
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
