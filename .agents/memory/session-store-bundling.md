---
name: Session store + esbuild bundling
description: Why connect-pg-simple's createTableIfMissing breaks in this repo and how the session table is created instead.
---

# connect-pg-simple `createTableIfMissing` is unsafe in this repo

Do not rely on `createTableIfMissing: true` for the express-session pg store. Create the session table yourself at startup with idempotent SQL, and set `createTableIfMissing: false`.

**Why:** the api-server is bundled into a single CJS/ESM file with esbuild (output in `dist/`). `connect-pg-simple`'s create-table path reads a `table.sql` shipped in its package using a `__dirname`-relative path. After bundling, `__dirname` resolves to `dist/`, where no `table.sql` exists, so table creation throws `ENOENT ... dist/table.sql`. Worse, express-session saves the session asynchronously after the response is sent, so a missing session table fails silently — login appears to work but the session never persists and `/auth/me` keeps returning 401. Awaiting `req.session.regenerate()` (added for session-fixation protection on login/register) is what surfaces the error synchronously.

**How to apply:** keep an `ensureSessionTable()` that runs `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` (standard connect-pg-simple schema: `sid varchar pk`, `sess json`, `expire timestamp(6)`) and `await` it before `app.listen`. Reuse the shared `pool` from `@workspace/db`. The same trap applies to any other library that reads sibling data files via `__dirname` once bundled.
