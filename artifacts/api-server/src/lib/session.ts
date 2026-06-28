import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";

const TABLE_NAME = "user_sessions";

const PgSession = connectPgSimple(session);

/**
 * Create the session table if it does not exist.
 *
 * We do this explicitly rather than relying on connect-pg-simple's
 * `createTableIfMissing`, because that option reads a bundled `table.sql`
 * relative to `__dirname`. After esbuild bundles the server, `__dirname`
 * resolves to `dist/`, where no `table.sql` exists, so the option fails in
 * production. Creating the table ourselves is bundle-safe and idempotent.
 */
export async function ensureSessionTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${TABLE_NAME}" (
      "sid" varchar NOT NULL PRIMARY KEY,
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL
    );
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS "IDX_${TABLE_NAME}_expire" ON "${TABLE_NAME}" ("expire");`
  );
}

const sessionSecret = process.env["SESSION_SECRET"];

if (!sessionSecret && process.env["NODE_ENV"] === "production") {
  throw new Error("SESSION_SECRET is required in production.");
}

const isReplitProxy = Boolean(process.env["REPLIT_DEV_DOMAIN"] || process.env["REPLIT_DOMAINS"]);
const cookieSecure = isReplitProxy || process.env["NODE_ENV"] === "production";
const cookieSameSite = cookieSecure ? "none" : "lax";

export const sessionCookieOptions = {
  secure: cookieSecure,
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  sameSite: cookieSameSite as "none" | "lax",
};

const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: TABLE_NAME,
    createTableIfMissing: false,
  }),
  secret: sessionSecret || "dev-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: sessionCookieOptions,
});

export default sessionMiddleware;
