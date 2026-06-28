# Development Guide

This guide contains the essential commands needed to run the project locally and manage the database.

## 1. Prerequisites

Before running the project, make sure you have:
- Node.js installed (v20 or higher recommended, which supports `--env-file`).
- PostgreSQL installed and running locally (or a cloud PostgreSQL connection string).
- An `.env` file at the root of the workspace. A typical `.env` looks like:

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Database Connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/socioel

# Session
SESSION_SECRET=your_super_secret_session_key_here

# Push Notifications
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:notifications@socioel.app

# Frontend Config
VITE_API_URL=http://localhost:3000
BASE_PATH=/
```

## 2. Managing the Database (Drizzle ORM)

The database schema is defined in code within `lib/db/src/schema/`.

### Pushing Schema to the Database
When you make changes to your schema in the code (or if you are setting up the project for the first time), you need to push those fields to your PostgreSQL database. Run this command from the **root** of the project:

```bash
pnpm --filter @workspace/db push
```

### Viewing Database Data
To view your database tables and data in a web interface (Drizzle Studio), run:

```bash
pnpm --filter @workspace/db exec drizzle-kit studio
```

## 3. Running the Code (Frontend & Backend)

To start both the API server and the Frontend application simultaneously, use the following `pnpm` command from the **root** of the project:

```bash
pnpm -r --parallel --filter @workspace/gatherup --filter @workspace/api-server dev
```

Alternatively, you can run them in separate terminal windows:

**Terminal 1 (Backend API):**
```bash
pnpm --filter @workspace/api-server dev
```

**Terminal 2 (Frontend App):**
```bash
pnpm --filter @workspace/gatherup dev
```
