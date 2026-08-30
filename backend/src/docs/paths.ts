import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { errorResponse, jsonBody, jsonResponse, rateLimitResponse, binaryResponse, successEnvelope } from "./helpers.js";
import { errors, successExamples } from "./examples.js";
import {
  adminUserSchema,
  analyticsOverviewSchema,
  brandSchema,
  cartSchema,
  categorySchema,
  couponSchema,
  couponValidationSchema,
  customerSchema,
  maintenanceJobSchema,
  maintenanceUserSchema,
  orderDetailSchema,
  orderSchema,
  productSchema,
  publicOrderConfirmationSchema,
  publicReviewSchema,
  reviewSchema
} from "./schemas.js";
import {
  adminLoginSchema,
  adminRequestPasswordResetSchema,
  adminResetPasswordSchema
} from "../validators/admin-auth.validator.js";
import {
  maintenanceLoginSchema,
  maintenanceRequestPasswordResetSchema,
  maintenanceResetPasswordSchema
} from "../validators/maintenance-auth.validator.js";
import { createProductSchema, productListQuerySchema, updateProductSchema } from "../validators/product.validator.js";
import { createCategorySchema, updateCategorySchema } from "../validators/category.validator.js";
import { createBrandSchema, updateBrandSchema } from "../validators/brand.validator.js";
import { searchQuerySchema } from "../validators/search.validator.js";
import { cartIdParamSchema, cartItemParamSchema, cartOwnershipQuerySchema, createCartSchema, updateCartItemsSchema } from "../validators/cart.validator.js";
import { checkoutSchema, confirmationParamsSchema, confirmationQuerySchema } from "../validators/checkout.validator.js";
import { orderListQuerySchema, orderStatusSchema } from "../validators/order.validator.js";
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from "../validators/coupon.validator.js";
import { createReviewSchema, reviewQuerySchema, reviewStatusSchema } from "../validators/review.validator.js";
import { idParamSchema, localeQuerySchema, paginationQuerySchema, slugParamSchema } from "../validators/common.validator.js";
import {
  createMaintenanceJobSchema,
  maintenanceExportQuerySchema,
  maintenanceJobParamsSchema,
  maintenanceJobQuerySchema,
  updateMaintenanceJobSchema
} from "../validators/maintenance-job.validator.js";

const validation400 = {
  "400": errorResponse("Request validation failed.", { validation: errors.validation })
};

const internal500 = {
  "500": errorResponse("Unexpected server error.", { internal: errors.internal })
};

const adminAuthFailures = {
  "401": errorResponse("Not authenticated, or the admin token is missing/invalid/expired.", {
    adminAuthRequired: errors.adminAuthRequired,
    invalidAdminToken: errors.invalidAdminToken
  }),
  "403": errorResponse("Authenticated, but the admin role cannot perform this action.", {
    adminForbidden: errors.adminForbidden
  })
};

const maintenanceAuthFailures = {
  "401": errorResponse("Not authenticated, or the maintenance token is missing/invalid/expired.", {
    maintenanceAuthRequired: errors.maintenanceAuthRequired,
    invalidMaintenanceToken: errors.invalidMaintenanceToken
  }),
  "403": errorResponse("Authenticated, but the maintenance role cannot perform this action.", {
    maintenanceForbidden: errors.maintenanceForbidden
  })
};

const rateLimited429 = {
  "429": rateLimitResponse()
};

export function registerPaths(registry: OpenAPIRegistry): void {
  // ---------------------------------------------------------------- Admin auth
  registry.registerPath({
    method: "post",
    path: "/api/v1/admin/auth/login",
    operationId: "adminLogin",
    tags: ["Auth (Admin)"],
    summary: "Admin login",
    description:
      "Authenticates an admin with email + password and returns an access token. The refresh token is NOT returned in the body; it is set as an httpOnly, sameSite=strict cookie named `admin_refresh_token`, scoped to the path `/api/v1/admin/auth/refresh`. Rate limited to 10 requests per 15 minutes per IP.",
    security: [],
    request: { body: jsonBody(adminLoginSchema, "Admin credentials.") },
    responses: {
      "200": {
        ...jsonResponse(
          "Login succeeded. The refresh token is delivered via the Set-Cookie header.",
          successEnvelope(z.object({ admin: adminUserSchema, accessToken: z.string() })),
          { adminLogin: successExamples.adminLogin }
        ),
        headers: {
          "Set-Cookie": {
            description: "Sets `admin_refresh_token` (httpOnly, sameSite=strict) scoped to /api/v1/admin/auth/refresh.",
            schema: { type: "string" }
          }
        }
      },
      ...validation400,
      "401": errorResponse("Invalid credentials.", { invalidAdminCredentials: errors.invalidAdminCredentials }),
      ...rateLimited429,
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/admin/auth/logout",
    operationId: "adminLogout",
    tags: ["Auth (Admin)"],
    summary: "Admin logout",
    description:
      "Clears the `admin_refresh_token` cookie. Accepts no request body. Issued JWTs remain valid until they naturally expire.",
    security: [],
    responses: {
      "200": jsonResponse("Logged out.", successEnvelope(z.object({ loggedOut: z.boolean() })), {
        loggedOut: successExamples.loggedOut
      }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/admin/auth/refresh",
    operationId: "adminRefreshToken",
    tags: ["Auth (Admin)"],
    summary: "Refresh admin access token",
    description:
      "Issues a new access token using the httpOnly `admin_refresh_token` cookie (sent automatically by the browser). Each refresh rotates the token: the previous refresh token is revoked server-side and a new one is issued via Set-Cookie. A token that was revoked (e.g. by logout or a prior rotation) is rejected with 401 INVALID_REFRESH_TOKEN, even if its JWT signature is still valid. Rate limited to 10 requests per 15 minutes per IP.",
    security: [],
    responses: {
      "200": {
        ...jsonResponse(
          "New access token issued; the refresh token cookie is also rotated.",
          successEnvelope(z.object({ accessToken: z.string() })),
          { tokenRefresh: successExamples.tokenRefresh }
        ),
        headers: {
          "Set-Cookie": {
            description: "Rotates `admin_refresh_token` (httpOnly, sameSite=strict).",
            schema: { type: "string" }
          }
        }
      },
      "401": errorResponse("Refresh token missing, invalid, expired, revoked, or the admin no longer exists.", {
        refreshTokenRequired: errors.refreshTokenRequired,
        invalidRefreshToken: errors.invalidRefreshToken,
        adminNotFound: errors.adminNotFound
      }),
      ...rateLimited429,
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/admin/auth/request-password-reset",
    operationId: "adminRequestPasswordReset",
    tags: ["Auth (Admin)"],
    summary: "Request an admin password reset",
    description:
      "Generates a single-use, time-limited reset token for an admin and emails it. The response is always the same generic message whether or not the email exists, so the endpoint cannot be used to enumerate accounts. Rate limited to 10 requests per 15 minutes per IP.",
    security: [],
    request: { body: jsonBody(adminRequestPasswordResetSchema, "Admin email.") },
    responses: {
      "200": jsonResponse(
        "Reset email sent (or a generic message when the email is unknown).",
        successEnvelope(z.object({ message: z.string() })),
        { resetRequested: successExamples.resetRequested }
      ),
      ...validation400,
      ...rateLimited429,
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/admin/auth/reset-password",
    operationId: "adminResetPassword",
    tags: ["Auth (Admin)"],
    summary: "Reset admin password",
    description:
      "Sets a new admin password using a single-use reset token issued by the request-password-reset endpoint. The token can only be used once and expires after 30 minutes. Rate limited to 10 requests per 15 minutes per IP.",
    security: [],
    request: { body: jsonBody(adminResetPasswordSchema, "Reset token and new password.") },
    responses: {
      "200": jsonResponse("Password reset.", successEnvelope(z.object({ reset: z.boolean() })), {
        resetDone: successExamples.resetDone
      }),
      ...validation400,
      "401": errorResponse("Reset token is invalid, expired, or already used.", {
        invalidResetToken: errors.invalidResetToken
      }),
      ...rateLimited429,
      ...internal500
    }
  });

  // --------------------------------------------------------- Maintenance auth
  registry.registerPath({
    method: "post",
    path: "/api/v1/maintenance/auth/login",
    operationId: "maintenanceLogin",
    tags: ["Auth (Maintenance)"],
    summary: "Maintenance login",
    description:
      "Authenticates a maintenance user (admin or worker) and returns an access token. The refresh token is set as an httpOnly, sameSite=strict cookie named `maintenance_refresh_token`, scoped to `/api/v1/maintenance/auth/refresh`. Rate limited to 10 requests per 15 minutes per IP.",
    security: [],
    request: { body: jsonBody(maintenanceLoginSchema, "Maintenance credentials.") },
    responses: {
      "200": {
        ...jsonResponse(
          "Login succeeded. The refresh token is delivered via the Set-Cookie header.",
          successEnvelope(z.object({ user: maintenanceUserSchema, accessToken: z.string() })),
          { maintenanceLogin: successExamples.maintenanceLogin }
        ),
        headers: {
          "Set-Cookie": {
            description: "Sets `maintenance_refresh_token` (httpOnly, sameSite=strict) scoped to /api/v1/maintenance/auth/refresh.",
            schema: { type: "string" }
          }
        }
      },
      ...validation400,
      "401": errorResponse("Invalid credentials.", {
        invalidMaintenanceCredentials: errors.invalidMaintenanceCredentials
      }),
      ...rateLimited429,
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/maintenance/auth/logout",
    operationId: "maintenanceLogout",
    tags: ["Auth (Maintenance)"],
    summary: "Maintenance logout",
    description: "Clears the `maintenance_refresh_token` cookie. Accepts no request body.",
    security: [],
    responses: {
      "200": jsonResponse("Logged out.", successEnvelope(z.object({ loggedOut: z.boolean() })), {
        loggedOut: successExamples.loggedOut
      }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/maintenance/auth/refresh",
    operationId: "maintenanceRefreshToken",
    tags: ["Auth (Maintenance)"],
    summary: "Refresh maintenance access token",
    description:
      "Issues a new access token using the httpOnly `maintenance_refresh_token` cookie. Each refresh rotates the token: the previous refresh token is revoked server-side and a new one is issued via Set-Cookie. A token that was revoked (e.g. by logout or a prior rotation) is rejected with 401 MAINTENANCE_INVALID_REFRESH_TOKEN, even if its JWT signature is still valid. Rate limited to 10 requests per 15 minutes per IP.",
    security: [],
    responses: {
      "200": {
        ...jsonResponse(
          "New access token issued; the refresh token cookie is also rotated.",
          successEnvelope(z.object({ accessToken: z.string() })),
          { tokenRefresh: successExamples.tokenRefresh }
        ),
        headers: {
          "Set-Cookie": {
            description: "Rotates `maintenance_refresh_token` (httpOnly, sameSite=strict).",
            schema: { type: "string" }
          }
        }
      },
      "401": errorResponse("Refresh token missing, invalid, expired, revoked, or the maintenance user no longer exists.", {
        maintenanceRefreshTokenRequired: errors.maintenanceRefreshTokenRequired,
        maintenanceInvalidRefreshToken: errors.maintenanceInvalidRefreshToken,
        maintenanceUserNotFound: errors.maintenanceUserNotFound
      }),
      ...rateLimited429,
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/maintenance/auth/request-password-reset",
    operationId: "maintenanceRequestPasswordReset",
    tags: ["Auth (Maintenance)"],
    summary: "Request a maintenance password reset",
    description:
      "Generates a single-use, time-limited reset token for a maintenance user and emails it. The response is always the same generic message whether or not the email exists, so the endpoint cannot be used to enumerate accounts. Rate limited to 10 requests per 15 minutes per IP.",
    security: [],
    request: { body: jsonBody(maintenanceRequestPasswordResetSchema, "Maintenance email.") },
    responses: {
      "200": jsonResponse(
        "Reset email sent (or a generic message when the email is unknown).",
        successEnvelope(z.object({ message: z.string() })),
        { resetRequested: successExamples.resetRequested }
      ),
      ...validation400,
      ...rateLimited429,
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/maintenance/auth/reset-password",
    operationId: "maintenanceResetPassword",
    tags: ["Auth (Maintenance)"],
    summary: "Reset maintenance password",
    description:
      "Sets a new maintenance password using a single-use reset token issued by the request-password-reset endpoint. The token can only be used once and expires after 30 minutes. Rate limited to 10 requests per 15 minutes per IP.",
    security: [],
    request: { body: jsonBody(maintenanceResetPasswordSchema, "Reset token and new password.") },
    responses: {
      "200": jsonResponse("Password reset.", successEnvelope(z.object({ reset: z.boolean() })), {
        resetDone: successExamples.resetDone
      }),
      ...validation400,
      "401": errorResponse("Reset token is invalid, expired, or already used.", {
        invalidResetToken: errors.invalidResetToken
      }),
      ...rateLimited429,
      ...internal500
    }
  });

  // ----------------------------------------------------------------- Products
  registry.registerPath({
    method: "get",
    path: "/api/v1/products",
    operationId: "listProducts",
    tags: ["Products"],
    summary: "List products",
    description:
      "Lists active products (`is_active = true`). Supports keyword (`q`), `categoryId`, `brandId`, `minPrice`, `maxPrice`, `inStock` and `sort` filters plus pagination. Optional `locale` query parameter (en/ar/he, default en) selects the content language for translatable fields (name, description, specifications, warranty); when a translation is missing — the row or an individual column — that field falls back to the English base value. slug, price, discount, images, compatible_devices, stock_quantity, rating and ids are language-independent. Public — no auth required.",
    security: [],
    request: { query: productListQuerySchema },
    responses: {
      "200": jsonResponse("List of active products.", successEnvelope(z.array(productSchema)), {
        productList: successExamples.productList
      }),
      ...validation400,
      ...internal500
    }
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/products/{slug}",
    operationId: "getProductBySlug",
    tags: ["Products"],
    summary: "Get a product by slug",
    description:
      "Returns a single active product by its unique slug. Optional `locale` query parameter (en/ar/he, default en) selects the content language for translatable fields (name, description, specifications, warranty); any missing translation falls back to the English base value per field. Public — no auth required.",
    security: [],
    request: { params: slugParamSchema, query: localeQuerySchema },
    responses: {
      "200": jsonResponse("The product.", successEnvelope(productSchema), { product: successExamples.product }),
      ...validation400,
      "404": errorResponse("Product was not found.", { productNotFound: errors.productNotFound }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/products",
    operationId: "createProduct",
    tags: ["Products"],
    summary: "Create a product",
    description:
      "Creates a product with localized translations. Requires `adminAuth` with role `super_admin` or `staff`. NOTE: `brandId`/`categoryId` foreign keys and slug uniqueness are not pre-validated — a violation surfaces as a 500 INTERNAL_SERVER_ERROR.",
    security: [{ adminAuth: [] }],
    request: { body: jsonBody(createProductSchema, "Product payload.") },
    responses: {
      "201": jsonResponse("Product created.", successEnvelope(productSchema), { product: successExamples.product }),
      ...validation400,
      ...adminAuthFailures,
      ...internal500
    }
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/products/{id}",
    operationId: "updateProduct",
    tags: ["Products"],
    summary: "Update a product",
    description:
      "Partially updates a product. Requires `adminAuth` with role `super_admin` or `staff`. If `translations` is provided, the full translation set is replaced.",
    security: [{ adminAuth: [] }],
    request: {
      params: idParamSchema,
      body: jsonBody(updateProductSchema, "Fields to update.")
    },
    responses: {
      "200": jsonResponse("Product updated.", successEnvelope(productSchema), { product: successExamples.product }),
      ...validation400,
      ...adminAuthFailures,
      "404": errorResponse("Product was not found.", { productNotFound: errors.productNotFound }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "delete",
    path: "/api/v1/products/{id}",
    operationId: "deleteProduct",
    tags: ["Products"],
    summary: "Delete a product",
    description: "Hard-deletes a product. Requires `adminAuth` with role `super_admin` ONLY — staff receive 403.",
    security: [{ adminAuth: [] }],
    request: { params: idParamSchema },
    responses: {
      "200": jsonResponse("Product deleted.", successEnvelope(z.object({ deleted: z.boolean() })), {
        deleted: successExamples.deleted
      }),
      ...adminAuthFailures,
      "404": errorResponse("Product was not found.", { productNotFound: errors.productNotFound }),
      ...internal500
    }
  });

  // --------------------------------------------------------------- Categories
  registry.registerPath({
    method: "get",
    path: "/api/v1/categories",
    operationId: "listCategories",
    tags: ["Categories"],
    summary: "List categories",
    description:
      "Lists all categories ordered by `display_order` then name. Optional `locale` query parameter (en/ar/he, default en) selects the content language for the translatable name/description fields; any missing translation falls back to the English base value per field. Public — no auth required.",
    security: [],
    request: { query: localeQuerySchema },
    responses: {
      "200": jsonResponse("List of categories.", successEnvelope(z.array(categorySchema)), {
        categoryList: successExamples.categoryList
      }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/categories",
    operationId: "createCategory",
    tags: ["Categories"],
    summary: "Create a category",
    description:
      "Creates a category with localized translations. Requires `adminAuth` with role `super_admin` or `staff`. NOTE: slug uniqueness is not pre-validated — a duplicate surfaces as a 500.",
    security: [{ adminAuth: [] }],
    request: { body: jsonBody(createCategorySchema, "Category payload.") },
    responses: {
      "201": jsonResponse("Category created.", successEnvelope(categorySchema), { category: successExamples.category }),
      ...validation400,
      ...adminAuthFailures,
      ...internal500
    }
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/categories/{id}",
    operationId: "updateCategory",
    tags: ["Categories"],
    summary: "Update a category",
    description:
      "Partially updates a category. Requires `adminAuth` with role `super_admin` or `staff`. If `translations` is provided, the full translation set is replaced.",
    security: [{ adminAuth: [] }],
    request: {
      params: idParamSchema,
      body: jsonBody(updateCategorySchema, "Fields to update.")
    },
    responses: {
      "200": jsonResponse("Category updated.", successEnvelope(categorySchema), { category: successExamples.category }),
      ...validation400,
      ...adminAuthFailures,
      "404": errorResponse("Category was not found.", { categoryNotFound: errors.categoryNotFound }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "delete",
    path: "/api/v1/categories/{id}",
    operationId: "deleteCategory",
    tags: ["Categories"],
    summary: "Delete a category",
    description: "Hard-deletes a category. Requires `adminAuth` with role `super_admin` ONLY — staff receive 403.",
    security: [{ adminAuth: [] }],
    request: { params: idParamSchema },
    responses: {
      "200": jsonResponse("Category deleted.", successEnvelope(z.object({ deleted: z.boolean() })), {
        deleted: successExamples.deleted
      }),
      ...adminAuthFailures,
      "404": errorResponse("Category was not found.", { categoryNotFound: errors.categoryNotFound }),
      ...internal500
    }
  });

  // ------------------------------------------------------------------- Brands
  registry.registerPath({
    method: "get",
    path: "/api/v1/brands",
    operationId: "listBrands",
    tags: ["Brands"],
    summary: "List brands",
    description:
      "Lists all brands ordered by name. Optional `locale` query parameter (en/ar/he, default en) selects the content language for the translatable name/description fields; any missing translation falls back to the English base value per field. Public — no auth required.",
    security: [],
    request: { query: localeQuerySchema },
    responses: {
      "200": jsonResponse("List of brands.", successEnvelope(z.array(brandSchema)), {
        brandList: successExamples.brandList
      }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/brands",
    operationId: "createBrand",
    tags: ["Brands"],
    summary: "Create a brand",
    description:
      "Creates a brand with localized translations. Requires `adminAuth` with role `super_admin` or `staff`. NOTE: slug uniqueness is not pre-validated — a duplicate surfaces as a 500.",
    security: [{ adminAuth: [] }],
    request: { body: jsonBody(createBrandSchema, "Brand payload.") },
    responses: {
      "201": jsonResponse("Brand created.", successEnvelope(brandSchema), { brand: successExamples.brand }),
      ...validation400,
      ...adminAuthFailures,
      ...internal500
    }
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/brands/{id}",
    operationId: "updateBrand",
    tags: ["Brands"],
    summary: "Update a brand",
    description:
      "Partially updates a brand. Requires `adminAuth` with role `super_admin` or `staff`. If `translations` is provided, the full translation set is replaced.",
    security: [{ adminAuth: [] }],
    request: {
      params: idParamSchema,
      body: jsonBody(updateBrandSchema, "Fields to update.")
    },
    responses: {
      "200": jsonResponse("Brand updated.", successEnvelope(brandSchema), { brand: successExamples.brand }),
      ...validation400,
      ...adminAuthFailures,
      "404": errorResponse("Brand was not found.", { brandNotFound: errors.brandNotFound }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "delete",
    path: "/api/v1/brands/{id}",
    operationId: "deleteBrand",
    tags: ["Brands"],
    summary: "Delete a brand",
    description: "Hard-deletes a brand. Requires `adminAuth` with role `super_admin` ONLY — staff receive 403.",
    security: [{ adminAuth: [] }],
    request: { params: idParamSchema },
    responses: {
      "200": jsonResponse("Brand deleted.", successEnvelope(z.object({ deleted: z.boolean() })), {
        deleted: successExamples.deleted
      }),
      ...adminAuthFailures,
      "404": errorResponse("Brand was not found.", { brandNotFound: errors.brandNotFound }),
      ...internal500
    }
  });

  // ------------------------------------------------------------------- Search
  registry.registerPath({
    method: "get",
    path: "/api/v1/search",
    operationId: "searchProducts",
    tags: ["Search"],
    summary: "Search products",
    description:
      "Keyword search across product name, description, brand name and category name (matching always runs against the English base columns). `q` is required (1–100 characters). Optional `locale` query parameter (en/ar/he, default en) selects the content language of the returned products for translatable fields; any missing translation falls back to the English base value per field. Results are ordered by rating desc then newest, and paginated. Public — no auth required.",
    security: [],
    request: { query: searchQuerySchema },
    responses: {
      "200": jsonResponse("Matching products.", successEnvelope(z.array(productSchema)), {
        productList: successExamples.productList
      }),
      ...validation400,
      ...internal500
    }
  });

  // --------------------------------------------------------------------- Cart
  registry.registerPath({
    method: "post",
    path: "/api/v1/cart",
    operationId: "createCart",
    tags: ["Cart"],
    summary: "Create a guest cart",
    description:
      "Creates a guest cart for a `sessionId` (min 8 characters). Uses INSERT ... ON CONFLICT, so a repeated call with the same `sessionId` returns the existing cart. The response never includes `session_id`. Public — no auth required; keep the `sessionId` secret, it is the capability token for all other cart endpoints.",
    security: [],
    request: { body: jsonBody(createCartSchema, "Cart session.") },
    responses: {
      "201": jsonResponse("Cart created (or existing cart for the same sessionId).", successEnvelope(cartSchema), {
        cart: successExamples.cart
      }),
      ...validation400,
      ...internal500
    }
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/cart/{id}",
    operationId: "getCart",
    tags: ["Cart"],
    summary: "Get a cart",
    description:
      "Returns a cart with its line items, joined with product name, price and images. Requires the `sessionId` query parameter to match the one the cart was created with; otherwise the request is rejected with 404 CART_NOT_FOUND. A nonexistent cart and a wrong `sessionId` return exactly the same 404 — there is no 403 — so cart ids cannot be enumerated. No bearer auth required: the secret `sessionId` acts as the capability token. Responses never include `session_id`.",
    security: [],
    request: { params: cartIdParamSchema, query: cartOwnershipQuerySchema },
    responses: {
      "200": jsonResponse("The cart with items (never includes session_id).", successEnvelope(cartSchema), { cart: successExamples.cart }),
      ...validation400,
      "404": errorResponse("No cart matches the id + sessionId pair.", { cartNotFound: errors.cartNotFound }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/cart/{id}/items",
    operationId: "updateCartItem",
    tags: ["Cart"],
    summary: "Add or update a cart line",
    description:
      "Adds or upserts a cart line by `productId` + `variantId`. Setting `quantity` to 0 removes the line. Requires the `sessionId` query parameter to match the one the cart was created with; nothing is written when it does not match — the request is rejected with 404 CART_NOT_FOUND (identical to a nonexistent cart, deliberately no 403, to prevent enumeration). No bearer auth required. NOTE: `productId` is not pre-validated — an unknown product surfaces as a 500.",
    security: [],
    request: {
      params: cartIdParamSchema,
      query: cartOwnershipQuerySchema,
      body: jsonBody(updateCartItemsSchema, "Line to add or update.")
    },
    responses: {
      "200": jsonResponse("The updated cart with items (never includes session_id).", successEnvelope(cartSchema), { cart: successExamples.cart }),
      ...validation400,
      "404": errorResponse("No cart matches the id + sessionId pair.", { cartNotFound: errors.cartNotFound }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "delete",
    path: "/api/v1/cart/{id}/items/{itemId}",
    operationId: "deleteCartItem",
    tags: ["Cart"],
    summary: "Remove a cart line",
    description:
      "Removes a single line item from a cart. Requires the `sessionId` query parameter to match the one the cart was created with; nothing is deleted when it does not match — the request is rejected with 404 CART_NOT_FOUND (identical to a nonexistent cart, deliberately no 403, to prevent enumeration). 404 CART_ITEM_NOT_FOUND is returned only for an owned cart whose line does not exist. No bearer auth required.",
    security: [],
    request: { params: cartItemParamSchema, query: cartOwnershipQuerySchema },
    responses: {
      "200": jsonResponse("Cart item deleted.", successEnvelope(z.object({ deleted: z.boolean() })), {
        deleted: successExamples.deleted
      }),
      ...validation400,
      "404": errorResponse("No cart matches the id + sessionId pair, or the cart has no such line.", {
        cartNotFound: errors.cartNotFound,
        cartItemNotFound: errors.cartItemNotFound
      }),
      ...internal500
    }
  });

  // ----------------------------------------------------------------- Checkout
  registry.registerPath({
    method: "post",
    path: "/api/v1/checkout",
    operationId: "checkout",
    tags: ["Checkout"],
    summary: "Place a guest order",
    description:
      "Places a guest order: validates each line item, applies the optional coupon, decrements stock, increments coupon usage and emails the order confirmation. `shippingAddress` is a free-form JSON object. Shipping fee and tax are currently fixed at 0. Rate limited to 20 requests per 15 minutes per IP. Public — no auth required.",
    security: [],
    request: { body: jsonBody(checkoutSchema, "Guest checkout payload.") },
    responses: {
      "201": jsonResponse("Order placed.", successEnvelope(orderSchema), { checkout: successExamples.checkout }),
      "400": errorResponse("Validation failed, or the coupon is expired/used up/does not meet the minimum.", {
        validation: errors.validation,
        couponExpired: errors.couponExpired,
        couponUsageLimit: errors.couponUsageLimit,
        couponMinimum: errors.couponMinimum
      }),
      "404": errorResponse("A line-item product or the coupon was not found.", {
        productNotFound: errors.productNotFound,
        couponNotFound: errors.couponNotFound
      }),
      "409": errorResponse("A line item exceeds the available stock.", { insufficientStock: errors.insufficientStock }),
      ...rateLimited429,
      ...internal500
    }
  });

  // ------------------------------------------------------------------- Orders
  registry.registerPath({
    method: "get",
    path: "/api/v1/orders/{id}/confirmation",
    operationId: "getOrderConfirmation",
    tags: ["Orders"],
    summary: "Get a guest order confirmation",
    description:
      "Public guest order confirmation. Returns the order only when the `email` query param matches the order's `customer_email`. A nonexistent id and a mismatched email return exactly the same generic 404 ORDER_NOT_FOUND — deliberately no 403 — so order ids cannot be enumerated. Returns a MINIMAL projection of the order: id, status, the money breakdown (subtotal, discount, shipping_fee, tax, total), created_at and customer_email. The response NEVER includes customer_name, customer_phone, shipping_address or coupon_code. Line items are not included. Rate limited to 10 requests per 15 minutes per IP. No auth required.",
    security: [],
    request: {
      params: confirmationParamsSchema,
      query: confirmationQuerySchema
    },
    responses: {
      "200": jsonResponse("The minimal public order confirmation (never includes name, phone, address or coupon code).", successEnvelope(publicOrderConfirmationSchema), { orderConfirmation: successExamples.orderConfirmation }),
      ...validation400,
      "404": errorResponse("No order matches the id + email.", { orderNotFound: errors.orderNotFound }),
      ...rateLimited429,
      ...internal500
    }
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/orders",
    operationId: "listOrders",
    tags: ["Orders"],
    summary: "List orders",
    description:
      "Admin order listing with optional `status` filter and pagination. Requires `adminAuth` with role `super_admin` or `staff`. Returns the order rows WITHOUT line items.",
    security: [{ adminAuth: [] }],
    request: { query: orderListQuerySchema },
    responses: {
      "200": jsonResponse("List of orders.", successEnvelope(z.array(orderSchema)), { orderList: successExamples.orderList }),
      ...validation400,
      ...adminAuthFailures,
      ...internal500
    }
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/orders/{id}",
    operationId: "getOrder",
    tags: ["Orders"],
    summary: "Get an order",
    description:
      "Returns a single order INCLUDING its line items. Requires `adminAuth` with role `super_admin` or `staff`.",
    security: [{ adminAuth: [] }],
    request: { params: idParamSchema },
    responses: {
      "200": jsonResponse("The order with its line items.", successEnvelope(orderDetailSchema), {
        orderDetail: successExamples.orderDetail
      }),
      ...adminAuthFailures,
      "404": errorResponse("Order was not found.", { orderNotFound: errors.orderNotFound }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/orders/{id}/status",
    operationId: "updateOrderStatus",
    tags: ["Orders"],
    summary: "Update an order status",
    description:
      "Updates the order status (pending/processing/shipped/delivered/cancelled/refunded). Requires `adminAuth` with role `super_admin` or `staff`.",
    security: [{ adminAuth: [] }],
    request: {
      params: idParamSchema,
      body: jsonBody(orderStatusSchema, "New status.")
    },
    responses: {
      "200": jsonResponse("Order status updated.", successEnvelope(orderSchema), { order: successExamples.order }),
      ...validation400,
      ...adminAuthFailures,
      "404": errorResponse("Order was not found.", { orderNotFound: errors.orderNotFound }),
      ...internal500
    }
  });

  // ------------------------------------------------------------------ Coupons
  registry.registerPath({
    method: "post",
    path: "/api/v1/coupons/validate",
    operationId: "validateCoupon",
    tags: ["Coupons"],
    summary: "Validate a coupon",
    description:
      "Validates a coupon code against a subtotal and returns the coupon row plus the computed discount. Used by the guest checkout flow. Public — no auth required.",
    security: [],
    request: { body: jsonBody(validateCouponSchema, "Coupon code and subtotal.") },
    responses: {
      "200": jsonResponse("Coupon is valid.", successEnvelope(couponValidationSchema), {
        couponValidation: successExamples.couponValidation
      }),
      "400": errorResponse("Validation failed, or the coupon is expired/used up/does not meet the minimum.", {
        validation: errors.validation,
        couponExpired: errors.couponExpired,
        couponUsageLimit: errors.couponUsageLimit,
        couponMinimum: errors.couponMinimum
      }),
      "404": errorResponse("Coupon was not found.", { couponNotFound: errors.couponNotFound }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/coupons",
    operationId: "listCoupons",
    tags: ["Coupons"],
    summary: "List coupons",
    description: "Lists all coupons, newest first. Requires `adminAuth` with role `super_admin` or `staff`.",
    security: [{ adminAuth: [] }],
    responses: {
      "200": jsonResponse("List of coupons.", successEnvelope(z.array(couponSchema)), {
        couponList: successExamples.couponList
      }),
      ...adminAuthFailures,
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/coupons",
    operationId: "createCoupon",
    tags: ["Coupons"],
    summary: "Create a coupon",
    description:
      "Creates a coupon. The code is uppercased on write. Requires `adminAuth` with role `super_admin` or `staff`. NOTE: duplicate codes are not pre-validated — a duplicate surfaces as a 500.",
    security: [{ adminAuth: [] }],
    request: { body: jsonBody(createCouponSchema, "Coupon payload.") },
    responses: {
      "201": jsonResponse("Coupon created.", successEnvelope(couponSchema), { coupon: successExamples.coupon }),
      ...validation400,
      ...adminAuthFailures,
      ...internal500
    }
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/coupons/{id}",
    operationId: "updateCoupon",
    tags: ["Coupons"],
    summary: "Update a coupon",
    description:
      "Partially updates a coupon. Requires `adminAuth` with role `super_admin` or `staff`. The code is uppercased on write.",
    security: [{ adminAuth: [] }],
    request: {
      params: idParamSchema,
      body: jsonBody(updateCouponSchema, "Fields to update.")
    },
    responses: {
      "200": jsonResponse("Coupon updated.", successEnvelope(couponSchema), { coupon: successExamples.coupon }),
      ...validation400,
      ...adminAuthFailures,
      "404": errorResponse("Coupon was not found.", { couponNotFound: errors.couponNotFound }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "delete",
    path: "/api/v1/coupons/{id}",
    operationId: "deleteCoupon",
    tags: ["Coupons"],
    summary: "Delete a coupon",
    description: "Hard-deletes a coupon. Requires `adminAuth` with role `super_admin` ONLY — staff receive 403.",
    security: [{ adminAuth: [] }],
    request: { params: idParamSchema },
    responses: {
      "200": jsonResponse("Coupon deleted.", successEnvelope(z.object({ deleted: z.boolean() })), {
        deleted: successExamples.deleted
      }),
      ...adminAuthFailures,
      "404": errorResponse("Coupon was not found.", { couponNotFound: errors.couponNotFound }),
      ...internal500
    }
  });

  // ------------------------------------------------------------------ Reviews
  registry.registerPath({
    method: "post",
    path: "/api/v1/reviews",
    operationId: "createReview",
    tags: ["Reviews"],
    summary: "Create a review",
    description:
      "Creates a review. The `reviewerEmail` must match a completed guest order (status processing/shipped/delivered) that contains the product, otherwise 403 REVIEW_NOT_VERIFIED. New reviews start with status `pending`. Public — no auth required.",
    security: [],
    request: { body: jsonBody(createReviewSchema, "Review payload.") },
    responses: {
      "201": jsonResponse("Review created (status pending).", successEnvelope(reviewSchema), {
        review: successExamples.review
      }),
      ...validation400,
      "403": errorResponse("Reviewer has no completed order for this product.", {
        reviewNotVerified: errors.reviewNotVerified
      }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/reviews",
    operationId: "listReviews",
    tags: ["Reviews"],
    summary: "List reviews for a product",
    description:
      "Lists APPROVED reviews for a product, newest first. Public — no auth required. Reviewer emails are never included in this listing.",
    security: [],
    request: { query: reviewQuerySchema },
    responses: {
      "200": jsonResponse("Approved reviews for the product (without reviewer emails).", successEnvelope(z.array(publicReviewSchema)), {
        reviewList: successExamples.reviewList
      }),
      ...validation400,
      ...internal500
    }
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/reviews/{id}/status",
    operationId: "updateReviewStatus",
    tags: ["Reviews"],
    summary: "Moderate a review",
    description:
      "Sets a review to `pending`, `approved` or `rejected` and refreshes the product's aggregate rating (approved reviews only). Requires `adminAuth` with role `super_admin` or `staff`.",
    security: [{ adminAuth: [] }],
    request: {
      params: idParamSchema,
      body: jsonBody(reviewStatusSchema, "New moderation status.")
    },
    responses: {
      "200": jsonResponse("Review status updated.", successEnvelope(reviewSchema), { review: successExamples.review }),
      ...validation400,
      ...adminAuthFailures,
      "404": errorResponse("Review was not found.", { reviewNotFound: errors.reviewNotFound }),
      ...internal500
    }
  });

  // -------------------------------------------------------------------- Admin
  registry.registerPath({
    method: "get",
    path: "/api/v1/admin/analytics/overview",
    operationId: "getAnalyticsOverview",
    tags: ["Admin"],
    summary: "Analytics overview",
    description:
      "Aggregated dashboard numbers: revenue and order volume (this week/this month), top products, low-stock products and recent orders. Requires `adminAuth` with role `super_admin` or `staff`.",
    security: [{ adminAuth: [] }],
    responses: {
      "200": jsonResponse("Analytics overview.", successEnvelope(analyticsOverviewSchema), {
        analytics: successExamples.analytics
      }),
      ...adminAuthFailures,
      ...internal500
    }
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/admin/customers",
    operationId: "listCustomers",
    tags: ["Admin"],
    summary: "List derived customers",
    description:
      "Customers derived from orders, grouped by email with order count, total spent and last order date. Requires `adminAuth` with role `super_admin` or `staff`. NOTE: unlike other paginated endpoints, this one returns the rows in `data` with NO pagination `meta`.",
    security: [{ adminAuth: [] }],
    request: { query: paginationQuerySchema },
    responses: {
      "200": jsonResponse("Derived customer rows.", successEnvelope(z.array(customerSchema)), {
        customerList: successExamples.customerList
      }),
      ...validation400,
      ...adminAuthFailures,
      ...internal500
    }
  });

  // ---------------------------------------------------------- Maintenance jobs
  registry.registerPath({
    method: "get",
    path: "/api/v1/maintenance/jobs",
    operationId: "listMaintenanceJobs",
    tags: ["Maintenance Jobs"],
    summary: "List maintenance jobs",
    description:
      "Lists maintenance jobs with optional `month` filter (YYYY-MM) and pagination. Requires `maintenanceAuth`. Role note: maintenance admins see all jobs; workers are restricted to their own jobs (enforced in the service layer, not by middleware).",
    security: [{ maintenanceAuth: [] }],
    request: { query: maintenanceJobQuerySchema },
    responses: {
      "200": jsonResponse("List of maintenance jobs.", successEnvelope(z.array(maintenanceJobSchema)), {
        maintenanceJobList: successExamples.maintenanceJobList
      }),
      ...validation400,
      ...maintenanceAuthFailures,
      ...internal500
    }
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/maintenance/jobs/export",
    operationId: "exportMaintenanceJobs",
    tags: ["Maintenance Jobs"],
    summary: "Export maintenance jobs (XLSX)",
    description:
      "Exports all maintenance jobs for a month (`month` must match the YYYY-MM pattern) as an XLSX workbook, downloaded as a binary attachment. Requires `maintenanceAuth` with role `admin` ONLY — workers receive 403 MAINTENANCE_FORBIDDEN. This is the only non-JSON response in the API.",
    security: [{ maintenanceAuth: [] }],
    request: { query: maintenanceExportQuerySchema },
    responses: {
      "200": binaryResponse("XLSX workbook stream."),
      ...validation400,
      ...maintenanceAuthFailures,
      ...internal500
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/v1/maintenance/jobs",
    operationId: "createMaintenanceJob",
    tags: ["Maintenance Jobs"],
    summary: "Create a maintenance job",
    description:
      "Creates a maintenance job and computes `net_amount` (customer − cost) and `net_profit` (net amount minus the worker's percentage). Requires `maintenanceAuth`. Role note: workers may only create jobs for themselves — setting `workerId` to another user returns 403, and omitting it defaults to the authenticated worker's id. Admins may assign any worker.",
    security: [{ maintenanceAuth: [] }],
    request: { body: jsonBody(createMaintenanceJobSchema, "Job details.") },
    responses: {
      "201": jsonResponse("Maintenance job created.", successEnvelope(maintenanceJobSchema), {
        maintenanceJob: successExamples.maintenanceJob
      }),
      ...validation400,
      ...maintenanceAuthFailures,
      ...internal500
    }
  });

  registry.registerPath({
    method: "get",
    path: "/api/v1/maintenance/jobs/{id}",
    operationId: "getMaintenanceJob",
    tags: ["Maintenance Jobs"],
    summary: "Get a maintenance job",
    description:
      "Returns a single maintenance job. Requires `maintenanceAuth`. Role note: workers can only view their own jobs — viewing another worker's job returns 403 MAINTENANCE_FORBIDDEN.",
    security: [{ maintenanceAuth: [] }],
    request: { params: maintenanceJobParamsSchema },
    responses: {
      "200": jsonResponse("The maintenance job.", successEnvelope(maintenanceJobSchema), {
        maintenanceJob: successExamples.maintenanceJob
      }),
      ...validation400,
      ...maintenanceAuthFailures,
      "404": errorResponse("Maintenance job was not found.", { maintenanceJobNotFound: errors.maintenanceJobNotFound }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "patch",
    path: "/api/v1/maintenance/jobs/{id}",
    operationId: "updateMaintenanceJob",
    tags: ["Maintenance Jobs"],
    summary: "Update a maintenance job",
    description:
      "Partially updates a maintenance job and recomputes `net_amount` / `net_profit` from the resulting cost price, customer price and percentage. Requires `maintenanceAuth` with role `admin` ONLY — workers receive 403.",
    security: [{ maintenanceAuth: [] }],
    request: {
      params: maintenanceJobParamsSchema,
      body: jsonBody(updateMaintenanceJobSchema, "Fields to update.")
    },
    responses: {
      "200": jsonResponse("Maintenance job updated.", successEnvelope(maintenanceJobSchema), {
        maintenanceJob: successExamples.maintenanceJob
      }),
      ...validation400,
      ...maintenanceAuthFailures,
      "404": errorResponse("Maintenance job was not found.", { maintenanceJobNotFound: errors.maintenanceJobNotFound }),
      ...internal500
    }
  });

  registry.registerPath({
    method: "delete",
    path: "/api/v1/maintenance/jobs/{id}",
    operationId: "deleteMaintenanceJob",
    tags: ["Maintenance Jobs"],
    summary: "Delete a maintenance job",
    description:
      "Hard-deletes a maintenance job. Requires `maintenanceAuth` with role `admin` ONLY — workers receive 403.",
    security: [{ maintenanceAuth: [] }],
    request: { params: maintenanceJobParamsSchema },
    responses: {
      "200": jsonResponse("Maintenance job deleted.", successEnvelope(z.object({ deleted: z.boolean() })), {
        deleted: successExamples.deleted
      }),
      ...maintenanceAuthFailures,
      "404": errorResponse("Maintenance job was not found.", { maintenanceJobNotFound: errors.maintenanceJobNotFound }),
      ...internal500
    }
  });
}
