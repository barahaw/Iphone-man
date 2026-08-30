import { z } from "zod";

const dateTime = z.string().datetime();

export const adminUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["super_admin", "staff"])
});

export const maintenanceUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "worker"])
});

export const productSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  brand_id: z.number().int().positive(),
  category_id: z.number().int().positive(),
  images: z.array(z.string()),
  description: z.string(),
  specifications: z.record(z.unknown()),
  compatible_devices: z.array(z.string()),
  warranty: z.string().nullable(),
  stock_quantity: z.number().int().nonnegative(),
  price: z.string(),
  discount: z.string().nullable(),
  rating: z.string(),
  is_active: z.boolean(),
  created_at: dateTime,
  updated_at: dateTime
});

export const brandSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  logo_url: z.string().nullable(),
  description: z.string().nullable(),
  created_at: dateTime,
  updated_at: dateTime
});

export const categorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  parent_id: z.number().int().positive().nullable(),
  display_order: z.number().int(),
  created_at: dateTime,
  updated_at: dateTime
});

export const couponSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.string(),
  min_order_value: z.string(),
  expires_at: dateTime.nullable(),
  usage_limit: z.number().int().nonnegative().nullable(),
  times_used: z.number().int().nonnegative(),
  created_at: dateTime,
  updated_at: dateTime
});

export const couponValidationSchema = z.object({
  coupon: z.object({
    code: z.string(),
    discount_type: z.enum(["percentage", "fixed"]),
    discount_value: z.string(),
    min_order_value: z.string(),
    expires_at: dateTime.nullable(),
    usage_limit: z.number().int().nonnegative().nullable(),
    times_used: z.number().int().nonnegative()
  }),
  discount: z.number().nonnegative()
});

export const cartItemSchema = z.object({
  id: z.number().int().positive(),
  cart_id: z.number().int().positive(),
  product_id: z.number().int().positive(),
  variant_id: z.number().int().positive().nullable(),
  quantity: z.number().int().nonnegative(),
  name: z.string(),
  price: z.string(),
  images: z.array(z.string()),
  created_at: dateTime
});

export const cartSchema = z.object({
  id: z.number().int().positive(),
  created_at: dateTime,
  items: z.array(cartItemSchema)
});

export const orderSchema = z.object({
  id: z.number().int().positive(),
  customer_name: z.string(),
  customer_email: z.string().email(),
  customer_phone: z.string(),
  shipping_address: z.record(z.unknown()),
  subtotal: z.string(),
  discount: z.string(),
  shipping_fee: z.string(),
  tax: z.string(),
  total: z.string(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]),
  created_at: dateTime,
  updated_at: dateTime
});

export const orderItemSchema = z.object({
  id: z.number().int().positive(),
  order_id: z.number().int().positive(),
  product_id: z.number().int().positive(),
  variant_id: z.number().int().positive().nullable(),
  quantity: z.number().int().positive(),
  unit_price: z.string(),
  created_at: dateTime
});

export const orderDetailSchema = orderSchema.extend({
  items: z.array(orderItemSchema)
});

export const publicOrderConfirmationSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]),
  subtotal: z.string(),
  discount: z.string(),
  shipping_fee: z.string(),
  tax: z.string(),
  total: z.string(),
  created_at: dateTime,
  customer_email: z.string().email()
});

export const reviewSchema = z.object({
  id: z.number().int().positive(),
  product_id: z.number().int().positive(),
  reviewer_name: z.string(),
  reviewer_email: z.string().email(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  created_at: dateTime
});

export const publicReviewSchema = reviewSchema.omit({ reviewer_email: true });

export const maintenanceJobSchema = z.object({
  id: z.number().int().positive(),
  worker_id: z.number().int().positive(),
  device_type: z.string(),
  part_type: z.string(),
  cost_price: z.string(),
  customer_price: z.string(),
  percentage: z.string(),
  net_amount: z.string(),
  net_profit: z.string(),
  created_at: dateTime
});

export const customerSchema = z.object({
  customer_email: z.string().email(),
  customer_name: z.string(),
  customer_phone: z.string(),
  order_count: z.number().int().nonnegative(),
  total_spent: z.string(),
  last_order_at: dateTime
});

export const analyticsOverviewSchema = z.object({
  revenue: z.object({
    thisWeek: z.number(),
    thisMonth: z.number()
  }),
  orderVolume: z.object({
    thisWeek: z.number(),
    thisMonth: z.number()
  }),
  topProducts: z.array(
    z.object({
      id: z.number().int().positive(),
      name: z.string(),
      slug: z.string(),
      price: z.string(),
      units_sold: z.number().int().nonnegative(),
      revenue: z.string()
    })
  ),
  lowStock: z.array(
    z.object({
      id: z.number().int().positive(),
      name: z.string(),
      slug: z.string(),
      stock_quantity: z.number().int().nonnegative(),
      price: z.string()
    })
  ),
  recentOrders: z.array(
    z.object({
      id: z.number().int().positive(),
      customer_name: z.string(),
      customer_email: z.string().email(),
      status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]),
      total: z.string(),
      created_at: dateTime
    })
  )
});
