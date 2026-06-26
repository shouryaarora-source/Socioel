---
name: Testing auth behind Secure cookies
description: Why authenticated curl smoke-tests fail over localhost and how to run them correctly on Replit.
---

When an app's session cookie is set with `secure: true` (common on Replit because dev preview + prod are both HTTPS through the proxy, often paired with `sameSite: "none"` for the cross-site iframe), a plain-HTTP client silently drops it.

**Symptom:** `curl -c jar ... localhost:80/api/auth/register` returns a user object (register succeeds), but every follow-up `curl -b jar ...` returns 401 "Not authenticated" — the cookie was never stored because the connection wasn't HTTPS.

**How to apply:** For authenticated multi-step smoke tests, hit `https://$REPLIT_DEV_DOMAIN/api/...` with a cookie jar (`-c` to save, `-b` to send). Plain `localhost:80` is fine only for unauthenticated checks (health, anonymous 401/403 assertions, public GETs).

**Why:** RFC 6265 `Secure` cookies are only stored/sent over HTTPS; curl honors this. The Replit dev domain terminates TLS at the proxy, so the cookie round-trips correctly there.
