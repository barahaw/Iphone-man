import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { openapiDocument } from "./docs/openapi.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { apiRoutes } from "./routes/index.js";

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"]
      }
    }
  })
);
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ data: { ok: true }, error: null, meta: {} });
});

if (env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
  app.get("/api-docs.json", (_req, res) => {
    res.json(openapiDocument);
  });
}

app.use("/api/v1", apiRoutes);
app.use(errorMiddleware);

