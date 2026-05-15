import compression from "compression";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

// Short-circuit the type-checking of the built output.
const BUILD_PATH = "./build/server/index.js";
const DEVELOPMENT = process.env.NODE_ENV === "development";
const PORT = Number.parseInt(process.env.PORT || "3000");

const app = express();

app.use(compression());
app.disable("x-powered-by");

// Security headers (Helmet).
// Neon Auth handles session cookies.
if (!DEVELOPMENT) console.log("Enabling production security middleware");

const neonAuthOrigin = (() => {
  try {
    return process.env.VITE_NEON_AUTH_URL
      ? new URL(process.env.VITE_NEON_AUTH_URL).origin
      : null;
  } catch {
    return null;
  }
})();

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          ...(DEVELOPMENT ? ["'unsafe-eval'"] : []),
        ],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "blob:", "https://images.unsplash.com"],
        "connect-src": [
          "'self'",
          ...(neonAuthOrigin ? [neonAuthOrigin] : []),
          ...(DEVELOPMENT ? ["ws://localhost:*", "http://localhost:*"] : []),
        ],
        "frame-ancestors": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        ...(DEVELOPMENT ? {} : { "upgrade-insecure-requests": [] }),
      },
    },
    strictTransportSecurity: DEVELOPMENT
      ? false
      : { maxAge: 63072000, includeSubDomains: true, preload: true },
    // Allow cross-origin images (Unsplash hero shots) - I will remove later
    // when I switch to local images.
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // SPA navigation needs same-origin embedding for the dev tools panel.
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

if (DEVELOPMENT) {
  console.log("Starting development server");
  const viteDevServer = await import("vite").then((vite) =>
    vite.createServer({
      server: { middlewareMode: true },
    }),
  );
  app.use(viteDevServer.middlewares);
  app.use(async (req, res, next) => {
    try {
      const source = await viteDevServer.ssrLoadModule("./server/app.ts");
      return await source.app(req, res, next);
    } catch (error) {
      if (typeof error === "object" && error instanceof Error) {
        viteDevServer.ssrFixStacktrace(error);
      }
      next(error);
    }
  });
} else {
  console.log("Starting production server");
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
  );
  app.use(morgan("tiny"));
  app.use(express.static("build/client", { maxAge: "1h" }));
  app.use(await import(BUILD_PATH).then((mod) => mod.app));
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
