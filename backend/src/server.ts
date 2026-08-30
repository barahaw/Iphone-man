import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/db.js";
import { writeOpenApiSpec } from "./docs/openapi.js";

const server = app.listen(env.PORT, () => {
  writeOpenApiSpec();
  console.info(`iPhone Man API listening on http://localhost:${env.PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    void pool.end();
  });
});

