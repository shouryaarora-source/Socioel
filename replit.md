# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- DB schema (source of truth): `lib/db/src/schema/` (`users.ts`, events, attendances). Push with `pnpm --filter @workspace/db run push-force`.
- API contract (source of truth): `lib/api-spec/openapi.yaml`. Regenerate Zod/hooks with `pnpm --filter @workspace/api-spec run codegen`.
- API routes: `artifacts/api-server/src/routes/` (`auth.ts`, `users.ts`, `events.ts`). Session setup: `artifacts/api-server/src/lib/session.ts`.
- Web app (Socioel): `artifacts/gatherup/src/` — pages in `pages/`, auth state in `contexts/AuthContext.tsx`.

## Architecture decisions

- **Auth is password-based.** Sign In takes an identifier (phone OR email) + password; Sign Up takes name/phone/password (+ optional email, gender, age, profession). Passwords hashed with Node's built-in `crypto.scrypt` (format `hash.salt`) — no external hashing dep.
- Sessions stored in Postgres via `connect-pg-simple` (table `user_sessions`). The session table is created explicitly at startup (`ensureSessionTable()` in `index.ts`); `createTableIfMissing` is intentionally `false` (see Gotchas).
- Session is regenerated on login/register (anti session-fixation) before assigning `userId`.
- `passwordHash` must never leave the server: every user-serializing route strips it (`auth.ts`, `users.ts` `serializeUser`, `events.ts` attendees). The OpenAPI `User` schema does not include it.

## Product

Socioel is a community events app for runs, walks, sports, hiking, and yoga. Users create an account, browse and create events by category, join events, and manage their profile.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Session store:** the api-server is bundled by esbuild, so `connect-pg-simple`'s `createTableIfMissing` cannot find its `table.sql` (`__dirname` → `dist/`). We create the `user_sessions` table ourselves via `ensureSessionTable()`; never re-enable `createTableIfMissing`.
- **DB schema changes:** use `pnpm --filter @workspace/db run push-force` — the plain `push` prompts interactively for destructive drops and needs a TTY.
- **API changes:** after editing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` and `pnpm run typecheck:libs` before touching server/client code.
- A pre-existing, unrelated type error lives at `artifacts/api-server/src/lib/objectStorage.ts(265)` (`signed_url`); it is not part of the auth work.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
