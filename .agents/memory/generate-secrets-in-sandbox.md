---
name: Generating server keys without leaking them
description: Pattern for creating self-generated secrets (e.g. VAPID keypairs) and storing them without ever exposing the value.
---

For secrets the app generates itself (not user-held credentials) — e.g. Web Push VAPID keypairs — `requestEnvVar` makes no sense (the user has nothing to paste) and printing the value would leak it.

**Pattern:** Do it entirely inside the `code_execution` sandbox so the value never enters chat/context:
1. Check first with `viewEnvVars({ keys: [...] })` and skip if already present (regenerating invalidates existing subscriptions/tokens).
2. Import the generating library from the right package via `createRequire` pointed at that package's `package.json` (workspace deps aren't always resolvable from repo root): e.g. `createRequire('/abs/path/to/artifacts/<svc>/package.json')('web-push').generateVAPIDKeys()`.
3. Store with `setEnvVars({ values: {...} })` (use `shared` so dev+prod match). Log only a non-sensitive proxy like key length — never the key itself.

**Why:** Keeps the private key out of the transcript and out of code, while still automating setup. `setEnvVars` writes to the managed env store (not source), so it's safe for generated server keys even though user-held API keys should still go through `requestEnvVar`.

**Gotcha:** Code that reads these vars at module load (not per-request) won't see them until its workflow restarts — restart the consuming service after setting.
