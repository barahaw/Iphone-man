import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { env } from "../config/env.js";
import { registerPaths } from "./paths.js";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "adminAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
    description:
      "Admin access token returned by POST /api/v1/admin/auth/login. Used for catalog, order, coupon, review and analytics endpoints. Required role is noted per endpoint."
});

registry.registerComponent("securitySchemes", "maintenanceAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
    description:
      "Maintenance access token returned by POST /api/v1/maintenance/auth/login. Used for /api/v1/maintenance/jobs endpoints. Required role is noted per endpoint."
});

registry.registerComponent("schemas", "ApiErrorBody", {
  type: "object",
  properties: {
    code: {
      type: "string",
      description: "Machine-readable error code, e.g. PRODUCT_NOT_FOUND."
    },
    message: {
      type: "string",
      description: "Human-readable error message."
    },
    details: {
      description: "Optional structured error details (e.g. Zod validation field errors)."
    }
  },
  required: ["code", "message"]
});

registry.registerComponent("schemas", "ApiErrorEnvelope", {
  type: "object",
  properties: {
    data: {
      nullable: true,
      description: "Always null on error responses."
    },
    error: {
      $ref: "#/components/schemas/ApiErrorBody"
    },
    meta: {
      type: "object",
      description: "Always an empty object on error responses."
    }
  },
  required: ["data", "error", "meta"]
});

registerPaths(registry);

export const openapiDocument = new OpenApiGeneratorV3(registry.definitions).generateDocument({
  openapi: "3.0.0",
  info: {
    title: "iPhone Man API",
    version: "1.0.0",
    description:
      "The iPhone Man API is the backend for a single-vendor online store that sells iPhone parts and accessories. " +
      "Customers browse the catalog and check out as guests (no accounts), paying via the checkout flow and receiving " +
      "an order confirmation by email. The API is protected by two fully independent JWT authentication systems: " +
      "`adminAuth` (super_admin / staff) for catalog, coupons, orders, reviews and analytics, and `maintenanceAuth` " +
      "(admin / worker) for the repair-jobs module. \n\n" +
      "Every response uses a `{ data, error, meta }` envelope. List endpoints paginate via `page`/`limit` query " +
      "parameters (default 1 / 20, max limit 100) and return pagination metadata in `meta`. Endpoints under " +
      "`/api/v1/maintenance/jobs` are all gated by `maintenanceAuth` at the router level; catalog and order mutations are " +
      "gated by `adminAuth`. The monthly export (GET /api/v1/maintenance/jobs/export) streams an XLSX workbook and is the " +
      "only non-JSON response in the API."
  },
  servers: [{ url: `http://localhost:${env.PORT}` }],
  tags: [
    { name: "Auth (Admin)", description: "Admin authentication: login, logout, token refresh and password reset. Uses the `adminAuth` bearer scheme; refresh tokens are delivered as the httpOnly `admin_refresh_token` cookie." },
    { name: "Auth (Maintenance)", description: "Maintenance module authentication. Uses the `maintenanceAuth` bearer scheme; refresh tokens are delivered as the httpOnly `maintenance_refresh_token` cookie." },
    { name: "Products", description: "Product catalog with localized translations." },
    { name: "Categories", description: "Product categories (optionally nested via parent_id)." },
    { name: "Brands", description: "Product brands." },
    { name: "Search", description: "Keyword search across products, brands and categories." },
    { name: "Cart", description: "Guest session carts." },
    { name: "Checkout", description: "Guest checkout that creates orders and sends confirmations." },
    { name: "Orders", description: "Guest order confirmation and admin order management." },
    { name: "Coupons", description: "Discount coupons, including public validation used during checkout." },
    { name: "Reviews", description: "Verified guest reviews and admin moderation." },
    { name: "Admin", description: "Admin analytics and derived customer reports." },
    { name: "Maintenance Jobs", description: "Maintenance repair-job tracking with monthly XLSX export." }
  ]
});

export function writeOpenApiSpec(): string {
  const docsDir = path.dirname(fileURLToPath(import.meta.url));
  const outFile = path.resolve(docsDir, "../../openapi.json");
  writeFileSync(outFile, JSON.stringify(openapiDocument, null, 2) + "\n");
  return outFile;
}
