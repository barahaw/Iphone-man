/**
 * Admin API client — all endpoints verified against backend routes.
 * Base URL is proxied by Vite dev server (/api/v1 → http://localhost:3000).
 *
 * Every authenticated call sends `Authorization: Bearer <accessToken>`.
 * The accessToken is retrieved lazily from the admin store to avoid circular
 * import problems; pass it in explicitly where needed.
 */

const BASE = "/api/v1";

/**
 * Generic fetch wrapper.
 * @param {string} path
 * @param {RequestInit} options
 * @param {string|null} accessToken
 */
async function apiFetch(path, options = {}, accessToken = null) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include", // send httpOnly refresh cookie
    headers,
  });

  const json = await res
    .json()
    .catch(() => ({ data: null, error: { message: "Invalid response" } }));

  if (!res.ok) {
    const err = new Error(json?.error?.message || `API error ${res.status}`);
    err.status = res.status;
    err.code = json?.error?.code;
    throw err;
  }

  return json; // { data, error, meta }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/admin/auth/login
 * Returns { data: { admin: {id, name, email, role}, accessToken } }
 * Also sets the admin_refresh_token httpOnly cookie (via Set-Cookie header).
 */
export async function adminLogin(email, password) {
  return apiFetch("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * POST /api/v1/admin/auth/refresh
 * Uses the admin_refresh_token httpOnly cookie automatically.
 * Returns { data: { accessToken } }
 */
export async function adminRefresh() {
  return apiFetch("/admin/auth/refresh", { method: "POST" });
}

/**
 * POST /api/v1/admin/auth/logout
 * Clears refresh cookie server-side.
 */
export async function adminLogout(accessToken) {
  return apiFetch("/admin/auth/logout", { method: "POST" }, accessToken);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/analytics/overview
 * Returns {
 *   revenue: { thisWeek, thisMonth },
 *   orderVolume: { thisWeek, thisMonth },
 *   topProducts: [{id, name, slug, price, units_sold, revenue}],
 *   lowStock: [{id, name, slug, stock_quantity, price}],
 *   recentOrders: [{id, customer_name, customer_email, status, total, created_at}]
 * }
 */
export async function fetchAnalyticsOverview(accessToken) {
  return apiFetch("/admin/analytics/overview", {}, accessToken);
}

// ─── Customers ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/customers?page=&limit=
 * Returns array of { customer_email, customer_name, customer_phone,
 *                    order_count, total_spent, last_order_at }
 */
export async function fetchAdminCustomers(
  accessToken,
  { page = 1, limit = 20 } = {},
) {
  return apiFetch(
    `/admin/customers?page=${page}&limit=${limit}`,
    {},
    accessToken,
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/orders?status=&page=&limit=
 * Returns { data: [...orders], meta: {page, limit, total, hasMore} }
 * Fields: id, customer_name, customer_email, customer_phone,
 *         shipping_address, status, subtotal, discount,
 *         shipping_fee, tax, total, coupon_code, created_at
 */
export async function fetchAdminOrders(
  accessToken,
  { status, page = 1, limit = 20 } = {},
) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set("status", status);
  return apiFetch(`/orders?${params}`, {}, accessToken);
}

/**
 * GET /api/v1/orders/:id
 * Returns { data: { ...order, items: [{id, order_id, product_id, variant_id, quantity, unit_price}] } }
 */
export async function fetchAdminOrder(accessToken, id) {
  return apiFetch(`/orders/${id}`, {}, accessToken);
}

/**
 * PATCH /api/v1/orders/:id/status
 * Body: { status }
 * Returns { data: updatedOrder }
 */
export async function updateOrderStatus(accessToken, id, status) {
  return apiFetch(
    `/orders/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    accessToken,
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/products?page=&limit=&locale=en
 * Returns { data: [...products], meta: {...} }
 * (Admin uses same public endpoint; no is_active filter in query)
 */
export async function fetchAdminProducts(
  accessToken,
  { page = 1, limit = 20 } = {},
) {
  return apiFetch(
    `/products?page=${page}&limit=${limit}&locale=en`,
    {},
    accessToken,
  );
}

/**
 * GET /api/v1/products/:slug?locale=en
 */
export async function fetchAdminProductBySlug(accessToken, slug) {
  return apiFetch(`/products/${slug}?locale=en`, {}, accessToken);
}

/**
 * POST /api/v1/products
 * Body matches createProductSchema:
 *   { name, slug, brandId, categoryId, images[], description, specifications,
 *     compatibleDevices[], warranty, stockQuantity, price, discount, isActive,
 *     translations[{locale, name, description, specifications, warranty}] }
 * Returns { data: product } with status 201
 */
export async function createProduct(accessToken, productData) {
  return apiFetch(
    "/products",
    {
      method: "POST",
      body: JSON.stringify(productData),
    },
    accessToken,
  );
}

/**
 * PATCH /api/v1/products/:id
 * Body: partial updateProductSchema (same fields, all optional)
 */
export async function updateProduct(accessToken, id, productData) {
  return apiFetch(
    `/products/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(productData),
    },
    accessToken,
  );
}

/**
 * DELETE /api/v1/products/:id — super_admin only
 */
export async function deleteProduct(accessToken, id) {
  return apiFetch(`/products/${id}`, { method: "DELETE" }, accessToken);
}

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * GET /api/v1/categories?locale=en
 * Returns array of { id, name, slug, parent_id, display_order }
 */
export async function fetchCategories(locale = "en") {
  return apiFetch(`/categories?locale=${locale}`);
}

/**
 * POST /api/v1/categories
 * Body: { name, slug, parentId?, displayOrder?, translations[] }
 */
export async function createCategory(accessToken, data) {
  return apiFetch(
    "/categories",
    { method: "POST", body: JSON.stringify(data) },
    accessToken,
  );
}

/**
 * PATCH /api/v1/categories/:id
 */
export async function updateCategory(accessToken, id, data) {
  return apiFetch(
    `/categories/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    accessToken,
  );
}

/**
 * DELETE /api/v1/categories/:id — super_admin only
 */
export async function deleteCategory(accessToken, id) {
  return apiFetch(`/categories/${id}`, { method: "DELETE" }, accessToken);
}

// ─── Brands ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/brands?locale=en
 * Returns array of { id, name, slug, logo_url, description }
 */
export async function fetchBrands(locale = "en") {
  return apiFetch(`/brands?locale=${locale}`);
}

/**
 * POST /api/v1/brands
 */
export async function createBrand(accessToken, data) {
  return apiFetch(
    "/brands",
    { method: "POST", body: JSON.stringify(data) },
    accessToken,
  );
}

/**
 * PATCH /api/v1/brands/:id
 */
export async function updateBrand(accessToken, id, data) {
  return apiFetch(
    `/brands/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    accessToken,
  );
}

/**
 * DELETE /api/v1/brands/:id — super_admin only
 */
export async function deleteBrand(accessToken, id) {
  return apiFetch(`/brands/${id}`, { method: "DELETE" }, accessToken);
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/coupons — admin only
 * Returns array of { id, code, discount_type, discount_value,
 *                    min_order_value, expires_at, usage_limit, times_used }
 */
export async function fetchCoupons(accessToken) {
  return apiFetch("/coupons", {}, accessToken);
}

/**
 * POST /api/v1/coupons
 * Body: { code, discountType, discountValue, minOrderValue, expiresAt?, usageLimit? }
 */
export async function createCoupon(accessToken, data) {
  return apiFetch(
    "/coupons",
    { method: "POST", body: JSON.stringify(data) },
    accessToken,
  );
}

/**
 * PATCH /api/v1/coupons/:id
 */
export async function updateCoupon(accessToken, id, data) {
  return apiFetch(
    `/coupons/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    accessToken,
  );
}

/**
 * DELETE /api/v1/coupons/:id — super_admin only
 */
export async function deleteCoupon(accessToken, id) {
  return apiFetch(`/coupons/${id}`, { method: "DELETE" }, accessToken);
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/reviews?status=pending — admin only, for moderation
 * Returns array of { id, product_id, product_name, product_slug, reviewer_name,
 *                    reviewer_email, rating, comment, status, created_at }
 */
export async function fetchReviews(accessToken, { status, productId } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (productId) params.set("productId", productId);
  return apiFetch(`/admin/reviews?${params}`, {}, accessToken);
}

/**
 * PATCH /api/v1/reviews/:id/status — admin only
 * Body: { status: 'approved'|'rejected'|'pending' }
 */
export async function updateReviewStatus(accessToken, id, status) {
  return apiFetch(
    `/reviews/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    accessToken,
  );
}
