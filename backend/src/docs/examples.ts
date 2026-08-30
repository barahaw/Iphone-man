import type { ExampleMap } from "./helpers.js";

const ts = {
  created: "2026-07-20T10:15:00.000Z",
  updated: "2026-08-01T14:30:00.000Z"
};

const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoxLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3ODQwMDAwMDAsImV4cCI6MTc4NDAwMDkwMH0.example";

export const sample = {
  admin: { id: 1, name: "Yara Mansour", email: "yara@iphone-man.test", role: "super_admin" },
  maintenanceAdmin: { id: 1, name: "Dani Cohen", email: "dani@iphone-man.test", role: "admin" },
  maintenanceWorker: { id: 2, name: "Omar Khalil", email: "omar@iphone-man.test", role: "worker" },
  brand: {
    id: 1,
    name: "Apple",
    slug: "apple",
    logo_url: "https://cdn.iphone-man.test/brands/apple.svg",
    description: "Genuine iPhone parts and accessories.",
    created_at: ts.created,
    updated_at: ts.updated
  },
  category: {
    id: 1,
    name: "Screens",
    slug: "screens",
    parent_id: null,
    display_order: 1,
    created_at: ts.created,
    updated_at: ts.updated
  },
  subcategory: {
    id: 2,
    name: "iPhone 15 Series",
    slug: "iphone-15-series",
    parent_id: 1,
    display_order: 2,
    created_at: ts.created,
    updated_at: ts.updated
  },
  product: {
    id: 101,
    name: "iPhone 15 Pro OLED Screen Replacement",
    slug: "iphone-15-pro-oled-screen",
    brand_id: 1,
    category_id: 2,
    images: ["https://cdn.iphone-man.test/products/iphone-15-pro-oled.png"],
    description: "Genuine-grade OLED display with True Tone support for iPhone 15 Pro.",
    specifications: { size: "6.1 inch", type: "OLED LTPO Super Retina XDR" },
    compatible_devices: ["iPhone 15 Pro"],
    warranty: "6 months",
    stock_quantity: 25,
    price: "149.99",
    discount: "129.99",
    rating: "4.8",
    is_active: true,
    created_at: ts.created,
    updated_at: ts.updated
  },
  lowStockProduct: {
    id: 104,
    name: "iPhone SE (2022) Battery",
    slug: "iphone-se-2022-battery",
    brand_id: 1,
    category_id: 4,
    images: ["https://cdn.iphone-man.test/products/iphone-se-2022-battery.png"],
    description: "Replacement 2018mAh battery for iPhone SE (2022).",
    specifications: { capacity: "2018 mAh" },
    compatible_devices: ["iPhone SE (2022)"],
    warranty: null,
    stock_quantity: 4,
    price: "19.99",
    discount: null,
    rating: "4.5",
    is_active: true,
    created_at: ts.created,
    updated_at: ts.updated
  },
  coupon: {
    id: 51,
    code: "SAVE10",
    discount_type: "percentage",
    discount_value: "10.00",
    min_order_value: "0.00",
    expires_at: "2026-12-31T23:59:59.000Z",
    usage_limit: 500,
    times_used: 128,
    created_at: ts.created,
    updated_at: ts.updated
  },
  cart: {
    id: 501,
    created_at: ts.created,
    items: [
      {
        id: 3001,
        cart_id: 501,
        product_id: 101,
        variant_id: null,
        quantity: 2,
        name: "iPhone 15 Pro OLED Screen Replacement",
        price: "149.99",
        images: ["https://cdn.iphone-man.test/products/iphone-15-pro-oled.png"],
        created_at: ts.created
      }
    ]
  },
  order: {
    id: 1001,
    customer_name: "Noor Haddad",
    customer_email: "noor@example.com",
    customer_phone: "+972555012345",
    shipping_address: { street: "Al Zahra St 12", city: "Jerusalem", country: "IL" },
    subtotal: "259.98",
    discount: "26.00",
    shipping_fee: "0.00",
    tax: "0.00",
    total: "233.98",
    status: "processing",
    created_at: ts.created,
    updated_at: ts.updated
  },
  publicOrderConfirmation: {
    id: 1001,
    status: "processing",
    subtotal: "259.98",
    discount: "26.00",
    shipping_fee: "0.00",
    tax: "0.00",
    total: "233.98",
    created_at: ts.created,
    customer_email: "noor@example.com"
  },
  orderItem: {
    id: 8001,
    order_id: 1001,
    product_id: 101,
    variant_id: null,
    quantity: 2,
    unit_price: "129.99",
    created_at: ts.created
  },
  review: {
    id: 701,
    product_id: 101,
    reviewer_name: "Noor Haddad",
    reviewer_email: "noor@example.com",
    rating: 5,
    comment: "Perfect fit and the colors are accurate. Highly recommend!",
    status: "approved",
    created_at: ts.created
  },
  publicReview: {
    id: 701,
    product_id: 101,
    reviewer_name: "Noor Haddad",
    rating: 5,
    comment: "Perfect fit and the colors are accurate. Highly recommend!",
    status: "approved",
    created_at: ts.created
  },
  maintenanceJob: {
    id: 9001,
    worker_id: 2,
    device_type: "iPhone 12",
    part_type: "Battery",
    cost_price: "20.00",
    customer_price: "60.00",
    percentage: "30.00",
    net_amount: "40.00",
    net_profit: "28.00",
    created_at: ts.created
  },
  customer: {
    customer_email: "noor@example.com",
    customer_name: "Noor Haddad",
    customer_phone: "+972555012345",
    order_count: 1,
    total_spent: "233.98",
    last_order_at: ts.created
  },
  analytics: {
    revenue: { thisWeek: 1240.5, thisMonth: 4875 },
    orderVolume: { thisWeek: 18, thisMonth: 64 },
    topProducts: [
      {
        id: 101,
        name: "iPhone 15 Pro OLED Screen Replacement",
        slug: "iphone-15-pro-oled-screen",
        price: "149.99",
        units_sold: 42,
        revenue: "5459.58"
      }
    ],
    lowStock: [
      {
        id: 104,
        name: "iPhone SE (2022) Battery",
        slug: "iphone-se-2022-battery",
        stock_quantity: 4,
        price: "19.99"
      }
    ],
    recentOrders: [
      {
        id: 1001,
        customer_name: "Noor Haddad",
        customer_email: "noor@example.com",
        status: "processing",
        total: "233.98",
        created_at: ts.created
      }
    ]
  }
} as const;

const err = (code: string, message: string, details?: unknown) => ({
  data: null,
  error: { code, message, ...(details !== undefined ? { details } : {}) },
  meta: {}
});

export const errors: Record<string, ExampleMap[string]> = {
  validation: {
    value: err(
      "VALIDATION_ERROR",
      "Request validation failed.",
      { formErrors: [], fieldErrors: { email: ["Invalid email address."] } }
    )
  },
  internal: {
    value: err("INTERNAL_SERVER_ERROR", "Something went wrong.")
  },
  adminAuthRequired: {
    value: err("ADMIN_AUTH_REQUIRED", "Admin authentication is required.")
  },
  invalidAdminToken: {
    value: err("INVALID_ADMIN_TOKEN", "Admin token is invalid or expired.")
  },
  adminForbidden: {
    value: err("ADMIN_FORBIDDEN", "Admin role is not allowed to perform this action.")
  },
  invalidAdminCredentials: {
    value: err("INVALID_ADMIN_CREDENTIALS", "Invalid admin credentials.")
  },
  refreshTokenRequired: {
    value: err("REFRESH_TOKEN_REQUIRED", "Refresh token is required.")
  },
  invalidRefreshToken: {
    value: err("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.")
  },
  adminNotFound: {
    value: err("ADMIN_NOT_FOUND", "Admin user was not found.")
  },
  invalidResetToken: {
    value: err("INVALID_RESET_TOKEN", "Reset token is invalid, expired, or already used.")
  },
  maintenanceAuthRequired: {
    value: err("MAINTENANCE_AUTH_REQUIRED", "Maintenance authentication is required.")
  },
  invalidMaintenanceToken: {
    value: err("INVALID_MAINTENANCE_TOKEN", "Maintenance token is invalid or expired.")
  },
  maintenanceForbidden: {
    value: err("MAINTENANCE_FORBIDDEN", "Maintenance role is not allowed to perform this action.")
  },
  invalidMaintenanceCredentials: {
    value: err("INVALID_MAINTENANCE_CREDENTIALS", "Invalid maintenance credentials.")
  },
  maintenanceRefreshTokenRequired: {
    value: err("MAINTENANCE_REFRESH_TOKEN_REQUIRED", "Refresh token is required.")
  },
  maintenanceInvalidRefreshToken: {
    value: err("MAINTENANCE_INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.")
  },
  maintenanceUserNotFound: {
    value: err("MAINTENANCE_USER_NOT_FOUND", "Maintenance user was not found.")
  },
  productNotFound: {
    value: err("PRODUCT_NOT_FOUND", "Product was not found.")
  },
  brandNotFound: {
    value: err("BRAND_NOT_FOUND", "Brand was not found.")
  },
  categoryNotFound: {
    value: err("CATEGORY_NOT_FOUND", "Category was not found.")
  },
  cartNotFound: {
    value: err("CART_NOT_FOUND", "Cart was not found.")
  },
  cartItemNotFound: {
    value: err("CART_ITEM_NOT_FOUND", "Cart item was not found.")
  },
  insufficientStock: {
    value: err("INSUFFICIENT_STOCK", "Product stock is not sufficient.")
  },
  couponNotFound: {
    value: err("COUPON_NOT_FOUND", "Coupon was not found.")
  },
  couponExpired: {
    value: err("COUPON_EXPIRED", "Coupon has expired.")
  },
  couponUsageLimit: {
    value: err("COUPON_USAGE_LIMIT_REACHED", "Coupon usage limit has been reached.")
  },
  couponMinimum: {
    value: err("COUPON_MINIMUM_NOT_MET", "Order subtotal does not meet the coupon minimum.")
  },
  orderNotFound: {
    value: err("ORDER_NOT_FOUND", "Order was not found.")
  },
  reviewNotVerified: {
    value: err("REVIEW_NOT_VERIFIED", "Review must match a completed guest order email.")
  },
  reviewNotFound: {
    value: err("REVIEW_NOT_FOUND", "Review was not found.")
  },
  maintenanceJobNotFound: {
    value: err("MAINTENANCE_JOB_NOT_FOUND", "Maintenance job was not found.")
  }
};

export const requestExamples: Record<string, ExampleMap[string]> = {
  adminLogin: {
    value: { email: "yara@iphone-man.test", password: "SuperSecret1" }
  },
  adminRequestPasswordReset: {
    value: { email: "yara@iphone-man.test" }
  },
  adminResetPassword: {
    value: {
      resetToken: "9f2c1e6b8d4a7f0e3c5b2a9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f",
      newPassword: "NewPassword1"
    }
  },
  maintenanceLogin: {
    value: { email: "dani@iphone-man.test", password: "MaintainAdmin1" }
  },
  maintenanceRequestPasswordReset: {
    value: { email: "dani@iphone-man.test" }
  },
  maintenanceResetPassword: {
    value: {
      resetToken: "9f2c1e6b8d4a7f0e3c5b2a9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f",
      newPassword: "NewPassword1"
    }
  },
  createProduct: {
    value: {
      name: "iPhone 15 Pro OLED Screen Replacement",
      slug: "iphone-15-pro-oled-screen",
      brandId: 1,
      categoryId: 2,
      images: ["https://cdn.iphone-man.test/products/iphone-15-pro-oled.png"],
      description: "Genuine-grade OLED display with True Tone support for iPhone 15 Pro.",
      specifications: { size: "6.1 inch", type: "OLED LTPO Super Retina XDR" },
      compatibleDevices: ["iPhone 15 Pro"],
      warranty: "6 months",
      stockQuantity: 25,
      price: 149.99,
      discount: 129.99,
      isActive: true,
      translations: [
        {
          locale: "en",
          name: "iPhone 15 Pro OLED Screen Replacement",
          description: "Genuine-grade OLED display with True Tone support.",
          specifications: { size: "6.1 inch" },
          warranty: "6 months"
        },
        {
          locale: "ar",
          name: "شاشة OLED بديلة لآيفون 15 برو",
          description: "شاشة OLED من الدرجة الممتازة مع دعم True Tone.",
          specifications: { size: "6.1 بوصة" },
          warranty: "6 أشهر"
        }
      ]
    }
  },
  updateProduct: {
    value: {
      discount: 119.99,
      stockQuantity: 30,
      translations: [
        {
          locale: "en",
          name: "iPhone 15 Pro OLED Screen Replacement",
          description: "Genuine-grade OLED display with True Tone support.",
          specifications: { size: "6.1 inch" },
          warranty: "6 months"
        }
      ]
    }
  },
  createBrand: {
    value: {
      name: "Apple",
      slug: "apple",
      logoUrl: "https://cdn.iphone-man.test/brands/apple.svg",
      description: "Genuine iPhone parts and accessories.",
      translations: [
        { locale: "en", name: "Apple", description: "Genuine iPhone parts and accessories." },
        { locale: "he", name: "אפל", description: "חלקי אייפון מקוריים ואביזרים." }
      ]
    }
  },
  updateBrand: {
    value: {
      description: "Genuine iPhone parts, batteries and accessories.",
      translations: [
        { locale: "en", name: "Apple", description: "Genuine iPhone parts and accessories." }
      ]
    }
  },
  createCategory: {
    value: {
      name: "Screens",
      slug: "screens",
      parentId: null,
      displayOrder: 1,
      translations: [
        { locale: "en", name: "Screens", description: "Display replacements." },
        { locale: "ar", name: "شاشات", description: "استبدال الشاشات." }
      ]
    }
  },
  updateCategory: {
    value: {
      displayOrder: 3,
      translations: [
        { locale: "en", name: "Screens", description: "Display replacements." }
      ]
    }
  },
  createCart: {
    value: { sessionId: "sess-7f3a9b2c" }
  },
  updateCartItems: {
    value: { productId: 101, variantId: null, quantity: 2 }
  },
  checkout: {
    value: {
      customerName: "Noor Haddad",
      customerEmail: "noor@example.com",
      customerPhone: "+972555012345",
      shippingAddress: { street: "Al Zahra St 12", city: "Jerusalem", country: "IL" },
      couponCode: "SAVE10",
      items: [{ productId: 101, variantId: null, quantity: 2 }]
    }
  },
  createCoupon: {
    value: {
      code: "SAVE10",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 0,
      expiresAt: "2026-12-31T23:59:59.000Z",
      usageLimit: 500
    }
  },
  updateCoupon: {
    value: { discountValue: 15 }
  },
  validateCoupon: {
    value: { code: "SAVE10", subtotal: 259.98 }
  },
  createReview: {
    value: {
      productId: 101,
      reviewerName: "Noor Haddad",
      reviewerEmail: "noor@example.com",
      rating: 5,
      comment: "Perfect fit and the colors are accurate. Highly recommend!"
    }
  },
  reviewStatus: {
    value: { status: "approved" }
  },
  orderStatus: {
    value: { status: "processing" }
  },
  createMaintenanceJob: {
    value: {
      workerId: 2,
      deviceType: "iPhone 12",
      partType: "Battery",
      costPrice: 20,
      customerPrice: 60,
      percentage: 30
    }
  },
  updateMaintenanceJob: {
    value: { partType: "Battery + Adhesive", customerPrice: 65 }
  }
};

export const successExamples: Record<string, ExampleMap[string]> = {
  adminLogin: {
    value: { data: { admin: sample.admin, accessToken }, error: null, meta: {} }
  },
  maintenanceLogin: {
    value: { data: { user: sample.maintenanceAdmin, accessToken }, error: null, meta: {} }
  },
  tokenRefresh: {
    value: { data: { accessToken }, error: null, meta: {} }
  },
  loggedOut: {
    value: { data: { loggedOut: true }, error: null, meta: {} }
  },
  resetDone: {
    value: { data: { reset: true }, error: null, meta: {} }
  },
  resetRequested: {
    value: {
      data: { message: "If an account exists for this email, a reset link has been sent." },
      error: null,
      meta: {}
    }
  },
  deleted: {
    value: { data: { deleted: true }, error: null, meta: {} }
  },
  product: {
    value: { data: sample.product, error: null, meta: {} }
  },
  productList: {
    value: {
      data: [sample.product],
      error: null,
      meta: { page: 1, limit: 20, total: 1, hasMore: false }
    }
  },
  brand: {
    value: { data: sample.brand, error: null, meta: {} }
  },
  brandList: {
    value: { data: [sample.brand], error: null, meta: {} }
  },
  category: {
    value: { data: sample.category, error: null, meta: {} }
  },
  categoryList: {
    value: { data: [sample.category, sample.subcategory], error: null, meta: {} }
  },
  coupon: {
    value: { data: sample.coupon, error: null, meta: {} }
  },
  couponList: {
    value: { data: [sample.coupon], error: null, meta: {} }
  },
  couponValidation: {
    value: {
      data: {
        coupon: {
          code: sample.coupon.code,
          discount_type: sample.coupon.discount_type,
          discount_value: sample.coupon.discount_value,
          min_order_value: sample.coupon.min_order_value,
          expires_at: sample.coupon.expires_at,
          usage_limit: sample.coupon.usage_limit,
          times_used: sample.coupon.times_used
        },
        discount: 26
      },
      error: null,
      meta: {}
    }
  },
  cart: {
    value: { data: sample.cart, error: null, meta: {} }
  },
  checkout: {
    value: { data: sample.order, error: null, meta: {} }
  },
  order: {
    value: { data: sample.order, error: null, meta: {} }
  },
  orderConfirmation: {
    value: { data: sample.publicOrderConfirmation, error: null, meta: {} }
  },
  orderDetail: {
    value: { data: { ...sample.order, items: [sample.orderItem] }, error: null, meta: {} }
  },
  orderList: {
    value: {
      data: [sample.order],
      error: null,
      meta: { page: 1, limit: 20, total: 1, hasMore: false }
    }
  },
  review: {
    value: { data: sample.review, error: null, meta: {} }
  },
  reviewList: {
    value: { data: [sample.publicReview], error: null, meta: {} }
  },
  analytics: {
    value: { data: sample.analytics, error: null, meta: {} }
  },
  customerList: {
    value: { data: [sample.customer], error: null, meta: {} }
  },
  maintenanceJob: {
    value: { data: sample.maintenanceJob, error: null, meta: {} }
  },
  maintenanceJobList: {
    value: {
      data: [sample.maintenanceJob],
      error: null,
      meta: { page: 1, limit: 20, total: 1, hasMore: false }
    }
  }
};

export { accessToken };
