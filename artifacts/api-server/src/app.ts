import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import sessionMiddleware from "./lib/session";

const app: Express = express();

// The app runs behind Replit's HTTPS proxy. Trust the first proxy hop so
// `req.secure` reflects the X-Forwarded-Proto header; without this,
// express-session refuses to set `secure` cookies (it sees the internal
// localhost hop as plain HTTP).
app.set("trust proxy", 1);

/**
 * Origins allowed to make credentialed (cookie-bearing) requests.
 *
 * The frontend and API are served same-origin through the Replit proxy
 * (path-based routing), so in normal operation no cross-origin access is
 * needed. We still build an explicit allowlist from the Replit domains so
 * that credentialed CORS is never reflected back to an arbitrary origin —
 * important because the session cookie is `SameSite=None`.
 */
function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  const devDomain = process.env["REPLIT_DEV_DOMAIN"];
  if (devDomain) origins.add(`https://${devDomain}`);
  const domains = process.env["REPLIT_DOMAINS"];
  if (domains) {
    for (const d of domains.split(",")) {
      const trimmed = d.trim();
      if (trimmed) origins.add(`https://${trimmed}`);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const localOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:4173",
      "http://127.0.0.1:4173",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5000",
      "http://127.0.0.1:5000",
      "https://socioel.onrender.com",
    ];
    for (const origin of localOrigins) {
      origins.add(origin);
    }
  }

  return origins;
}

const allowedOrigins = getAllowedOrigins();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Only reflect CORS credentials back to known Replit origins. Requests with no
// Origin header (same-origin browser requests, curl, server-to-server) are
// allowed; cross-origin requests from unknown sites get no CORS headers and are
// blocked by the browser.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else if (
        process.env.NODE_ENV !== "production" &&
        (origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:") ||
          origin.startsWith("http://192.168.") ||
          origin.startsWith("https://socioel.onrender.com") ||
          origin.startsWith("http://10."))
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  }),
);

// CSRF defense for cookie-session auth. Because the session cookie is
// `SameSite=None`, browsers will attach it to cross-site requests, so SameSite
// no longer blocks CSRF on its own. Reject state-changing requests whose Origin
// is present but not in the allowlist. Same-origin requests carry an allowed
// Origin; non-browser clients (no Origin) are unaffected.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
app.use((req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }
  const origin = req.get("origin");
  if (origin && !allowedOrigins.has(origin)) {
    // In development, allow local network IP addresses as well.
    if (
      process.env.NODE_ENV !== "production" &&
      (origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("https://socioel.onrender.com") ||
        origin.startsWith("https://www.socioel.com") ||
        origin.startsWith("http://10."))
    ) {
      next();
      return;
    }
    res.status(403).json({ error: "Cross-origin request blocked" });
    return;
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use("/api", router);

export default app;
