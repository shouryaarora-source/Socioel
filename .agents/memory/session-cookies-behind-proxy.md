---
name: Session cookies behind Replit's HTTPS proxy
description: Why cookie-session login "doesn't persist" on Replit, and the cookie + CORS + CSRF combo that fixes it correctly.
---

# Session cookies behind Replit's HTTPS proxy

Symptom: `express-session` login returns 200 but the next request is 401 — user
is asked to sign in repeatedly. Set-Cookie either never reaches the browser, or
the cookie is dropped in the embedded preview/webview.

**Root causes (two, they compound):**
1. `cookie.secure: true` without `app.set("trust proxy", 1)` → Express sees the
   internal localhost hop as plain HTTP (`req.secure === false`), so
   express-session silently refuses to emit the Secure cookie.
2. `sameSite: "strict" | "lax"` → the app loads inside a cross-site iframe (the
   Replit preview/webview), so the top-level origin differs from the app origin.
   Only `sameSite: "none"` cookies are sent in that third-party context.

**The fix that works in BOTH dev preview and production:**
- `app.set("trust proxy", 1)` (both are served over HTTPS through the proxy).
- Session cookie: `secure: true, sameSite: "none", httpOnly: true`, persistent
  `maxAge`. Do NOT make these env-conditional — the dev preview is also HTTPS via
  the proxy and is also an iframe, so it needs the same settings as prod.
- On logout, `res.clearCookie("connect.sid", { path: "/", httpOnly: true, secure: true, sameSite: "none" })` so attributes match and the cookie actually clears.

**Why:** verified end-to-end over `https://$REPLIT_DEV_DOMAIN` — only after
trust-proxy + secure + sameSite=none did Set-Cookie carry `Secure; SameSite=None`
and `/auth/me` return 200 with the cookie.

**Mandatory companions when you set `sameSite: "none"`** (it removes SameSite's
CSRF protection):
- Do NOT leave `cors({ origin: true, credentials: true })` — reflecting any
  origin + credentials lets any site make credentialed cross-origin calls. Use an
  allowlist built from `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS` (comma-separated),
  each as `https://<domain>`.
- Add an Origin check on state-changing methods (POST/PUT/PATCH/DELETE): reject
  when an Origin header is present and not in the allowlist. Same-origin requests
  carry an allowed Origin; non-browser clients (no Origin) pass through.

**How to apply:** any Express + cookie-session artifact in this repo. Files:
`artifacts/<api>/src/app.ts` (trust proxy, CORS allowlist, CSRF guard) and the
session middleware (`.../lib/session.ts`).

**Deployment note:** this fix only reaches end users after re-publishing — the
live app keeps running the previously deployed bundle until then.
