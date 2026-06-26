import session from "express-session";
import connectPgSimple from "connect-pg-simple";

const PgSession = connectPgSimple(session);

const sessionMiddleware = session({
  store: new PgSession({
    conString: process.env["DATABASE_URL"],
    tableName: "user_sessions",
    createTableIfMissing: true,
  }),
  secret: process.env["SESSION_SECRET"] || "dev-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env["NODE_ENV"] === "production",
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: process.env["NODE_ENV"] === "production" ? "strict" : "lax",
  },
});

export default sessionMiddleware;
