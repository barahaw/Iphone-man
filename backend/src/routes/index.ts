import { Router } from "express";
import { adminAuthRoutes } from "./admin-auth.routes.js";
import { adminRoutes } from "./admin.routes.js";
import { brandRoutes } from "./brand.routes.js";
import { cartRoutes } from "./cart.routes.js";
import { categoryRoutes } from "./category.routes.js";
import { checkoutRoutes } from "./checkout.routes.js";
import { couponRoutes } from "./coupon.routes.js";
import { maintenanceAuthRoutes } from "./maintenance-auth.routes.js";
import { maintenanceJobRoutes } from "./maintenance-job.routes.js";
import { orderRoutes } from "./order.routes.js";
import { productRoutes } from "./product.routes.js";
import { reviewRoutes } from "./review.routes.js";
import { searchRoutes } from "./search.routes.js";

export const apiRoutes = Router();

apiRoutes.use("/products", productRoutes);
apiRoutes.use("/categories", categoryRoutes);
apiRoutes.use("/brands", brandRoutes);
apiRoutes.use("/cart", cartRoutes);
apiRoutes.use("/checkout", checkoutRoutes);
apiRoutes.use("/orders", orderRoutes);
apiRoutes.use("/admin/auth", adminAuthRoutes);
apiRoutes.use("/admin", adminRoutes);
apiRoutes.use("/coupons", couponRoutes);
apiRoutes.use("/reviews", reviewRoutes);
apiRoutes.use("/search", searchRoutes);
apiRoutes.use("/maintenance/auth", maintenanceAuthRoutes);
apiRoutes.use("/maintenance/jobs", maintenanceJobRoutes);

