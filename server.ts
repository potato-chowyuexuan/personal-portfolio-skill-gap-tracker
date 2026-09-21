// Must run before any other import: server/db.ts reads DATABASE_URL from
// process.env at module-load time, and ESM evaluates imports (including
// transitive ones, like routes -> db) before any of this file's own code —
// so dotenv has to be loaded first, as an import itself, not as a later
// statement.
import "dotenv/config";

import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/routes";
import { seedIfEmpty } from "./server/seed";
import { DEFAULT_USER_ID } from "./src/data/initialData";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// FRONTEND_URL can be a single origin or a comma-separated list (e.g. a
// production domain plus Vercel preview deployments). Left unset, CORS is
// wide open, which is fine for local dev where frontend and backend share
// an origin anyway.
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  })
);

app.use(express.json());
app.use("/api", apiRouter);

async function startServer() {
  await seedIfEmpty(DEFAULT_USER_ID);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
