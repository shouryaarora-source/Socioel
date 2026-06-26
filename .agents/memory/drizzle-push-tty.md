---
name: Drizzle push in this repo
description: How to apply DB schema changes non-interactively in agent/CI runs.
---

# Use `push-force` for destructive schema changes

`pnpm --filter @workspace/db run push` (drizzle-kit push) prompts interactively when a change is destructive (e.g. dropping a table/column) and needs a TTY, which agent/CI runs don't have — it will hang or abort.

**Why:** drizzle-kit asks for confirmation before destructive operations. Without a TTY there is no way to answer the prompt.

**How to apply:** for non-interactive runs that include destructive changes, use the `push-force` script (`pnpm --filter @workspace/db run push-force`). Use the plain `push` only for additive, non-destructive changes or when you have an interactive shell.
