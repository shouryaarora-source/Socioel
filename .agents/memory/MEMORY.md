# Memory Index

- [Session store + esbuild bundling](session-store-bundling.md) — connect-pg-simple `createTableIfMissing` fails in prod; create the session table yourself.
- [Drizzle push in this repo](drizzle-push-tty.md) — destructive `push` needs a TTY; use the `push-force` script in CI/agent runs.
- [Session cookies behind Replit's HTTPS proxy](session-cookies-behind-proxy.md) — login won't persist without `trust proxy` + `secure` + `sameSite:none`; then lock CORS to an allowlist + add a CSRF origin check.
