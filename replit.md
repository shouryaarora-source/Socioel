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
- API routes: `artifacts/api-server/src/routes/` (`auth.ts`, `users.ts`, `events.ts`, `notifications.ts`, `push.ts`). Session setup: `artifacts/api-server/src/lib/session.ts`. Server libs: `lib/auth.ts` (`requireUserId`), `lib/notifications.ts` (`createNotification`), `lib/push.ts` (web-push send + VAPID).
- Web app (Socioel): `artifacts/gatherup/src/` — pages in `pages/`, auth state in `contexts/AuthContext.tsx`. Notifications UI: `components/NotificationsBell.tsx`; web push: `hooks/usePushNotifications.ts` + `public/sw.js`.

## Architecture decisions

- **Auth is password-based.** Sign In takes an identifier (phone OR email) + password; Sign Up takes name/phone/password (+ optional email, gender, age, profession). Passwords hashed with Node's built-in `crypto.scrypt` (format `hash.salt`) — no external hashing dep.
- Sessions stored in Postgres via `connect-pg-simple` (table `user_sessions`). The session table is created explicitly at startup (`ensureSessionTable()` in `index.ts`); `createTableIfMissing` is intentionally `false` (see Gotchas).
- Session is regenerated on login/register (anti session-fixation) before assigning `userId`.
- **Cookie persistence behind the proxy:** the API sets `app.set("trust proxy", 1)` and the session cookie is `secure: true, sameSite: "none", httpOnly: true` (not env-conditional) so it survives in both the dev preview and production — both are HTTPS via the Replit proxy and load the app in a cross-site iframe. Because `sameSite: "none"` drops SameSite's CSRF protection, CORS is locked to an allowlist (`REPLIT_DEV_DOMAIN` + `REPLIT_DOMAINS`) and state-changing requests are rejected when their `Origin` is present but not allowlisted (see `app.ts`). `logout` clears the cookie with matching attributes.
- `passwordHash` must never leave the server: every user-serializing route strips it (`auth.ts`, `users.ts` `serializeUser`, `events.ts` attendees). The OpenAPI `User` schema does not include it.
- **Actor identity comes from the session, never the request body.** `join`/`leave` derive the acting user via `requireUserId(req, res)` (the body's `userId` field is vestigial — still in the contract but ignored server-side) so a caller cannot act as / spoof another user. Likewise `GET /events/:id/requests` and approve/reject are host-only (compare `event.hostId` to the session user → 403 otherwise), and approve/reject only transition rows whose `status = 'pending'`.
- **Notifications:** `createNotification()` inserts a row then best-effort sends a Web Push; push failures are isolated and never break the originating join/approve flow. Triggers: join → notify host (`event_join`/`join_request`); host approve → notify requester (`request_approved`). Listing routes select only actor name/avatar + event title (no `passwordHash`).
- **Web Push (PWA):** VAPID keypair stored as shared env vars `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`. The service worker (`public/sw.js`) stores the push `url` relative (e.g. `events/{id}`) and resolves it against `registration.scope` on click so it works under the artifact's base path.

## Product

Socioel is a community events app for runs, walks, sports, hiking, and yoga. Users create an account, browse and create events by category, join events, and manage their profile. They get in-app + Web Push notifications when someone joins/requests their event (and when a host approves their request), plus a personalized "Suggested for you" event feed on the home page.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Session store:** the api-server is bundled by esbuild, so `connect-pg-simple`'s `createTableIfMissing` cannot find its `table.sql` (`__dirname` → `dist/`). We create the `user_sessions` table ourselves via `ensureSessionTable()`; never re-enable `createTableIfMissing`.
- **DB schema changes:** use `pnpm --filter @workspace/db run push-force` — the plain `push` prompts interactively for destructive drops and needs a TTY.
- **API changes:** after editing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` and `pnpm run typecheck:libs` before touching server/client code.
- A pre-existing, unrelated type error lives at `artifacts/api-server/src/lib/objectStorage.ts(265)` (`signed_url`); it is not part of the auth work.
- **Orval query hooks require `queryKey`:** the generated `use*` query hooks type their `query` option as a full `UseQueryOptions` (not `Partial`), so whenever you pass `query` options (e.g. `enabled`, `refetchInterval`) you MUST also pass `queryKey: getX...QueryKey()` (exported alongside each hook) or typecheck fails.
- **VAPID env vars need an api-server restart:** `lib/push.ts` reads the VAPID vars at module load, so after setting/changing them you must restart the `api-server` workflow.
- **Auth is behind a `Secure` cookie:** `curl` against `localhost:80` (plain HTTP) silently drops the session cookie, so authenticated smoke tests must hit `https://$REPLIT_DEV_DOMAIN/api/...` with a cookie jar (`-c`/`-b`).
- **IDs are integers** (`zod.coerce.number()` in params, `serial` in DB) — not UUIDs — when constructing test requests.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
