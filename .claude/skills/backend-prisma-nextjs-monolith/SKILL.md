---
name: backend-prisma-nextjs-monolith
description: >
  Next.js + Prisma full-stack monolith conventions: API routes, authentication
  with JWT httpOnly cookies, Prisma schema and migrations, S3-compatible file
  storage, Docker Compose setup. Use for apps like Filosofando or BearMe.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(pnpm *), Bash(npx prisma *), Bash(npx tsx *)
argument-hint: [feature or API to implement]
---

# Backend — Prisma + Next.js Monolith

Implement the feature described in `$ARGUMENTS` following the conventions below.

For frontend component conventions, also load the **frontend-web** skill.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, `output: "standalone"`) |
| Language | TypeScript (strict) |
| ORM | Prisma 6 with PostgreSQL |
| Auth | JWT (jose) + httpOnly cookies, bcryptjs for passwords |
| File Storage | S3-compatible (MinIO or AWS S3) |
| UI | shadcn/ui + Radix primitives + Tailwind CSS v4 |
| Containerization | Docker Compose (app + postgres + object storage) |

## Directory Structure

```
<project-root>/
├── prisma/
│   ├── schema.prisma          # Data model (single source of truth)
│   └── seed.ts                # Seed script
├── src/
│   ├── app/
│   │   ├── globals.css        # Tailwind + theme variables
│   │   ├── layout.tsx         # Root layout (AuthProvider, DataProvider)
│   │   ├── page.tsx           # Landing page (public)
│   │   ├── (public)/          # Unauthenticated pages (login, register)
│   │   ├── (app)/             # Authenticated pages
│   │   │   ├── layout.tsx     # Auth guard + shared chrome (navbar, etc.)
│   │   │   ├── admin/         # Admin pages (requires role=admin)
│   │   │   └── ...
│   │   ├── api/               # API routes (REST)
│   │   │   ├── auth/          # login, register, me, logout
│   │   │   ├── <resource>/    # CRUD routes per domain entity
│   │   │   └── upload/        # File upload to S3
│   │   └── components/        # Shared UI components
│   ├── contexts/              # Client-side React contexts
│   │   ├── AuthContext.tsx     # Auth state + API calls
│   │   └── DataContext.tsx     # Data state
│   └── lib/
│       ├── prisma.ts          # Singleton Prisma client
│       ├── auth.ts            # JWT sign/verify, session helpers
│       ├── storage.ts         # S3 upload/delete/URL helpers
│       └── api.ts             # API response helpers, auth middleware
├── docker-compose.yml
├── Dockerfile                 # Multi-stage build (standalone output)
└── .env
```

## Database

- **Engine**: PostgreSQL
- **Migrations**: `npx prisma migrate dev --name <description>` (dev), `npx prisma migrate deploy` (prod)
- **Seed**: `npx tsx prisma/seed.ts`

### Schema Conventions

- Use `cuid()` for all IDs.
- Use enums for fixed value sets.
- Join tables for many-to-many relationships (with `order` field when ordering matters).
- `@@unique` constraints on composite keys (e.g., `[userId, audioId]`).
- `onDelete: Cascade` on all foreign keys.
- Always include `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.

### Adding a New Model

1. Add the model to `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name add_<model_name>`.
3. Update seed script if initial data is needed.

## File Storage (S3-compatible)

- Use an S3-compatible service (MinIO for dev, AWS S3 for prod).
- One bucket per project, created automatically by a setup service.
- Upload endpoint: `POST /api/upload` (admin only, multipart form data).
- Store the returned URL on the model field.
- Helper functions in `lib/storage.ts`: `uploadFile()`, `deleteFile()`, `getPublicUrl()`.

## Authentication

- JWT tokens stored in **httpOnly cookies** (e.g., `<project>_token`).
- 7-day expiration.
- Session check: `GET /api/auth/me`.
- Auth middleware helpers in `lib/api.ts`:
  - `requireAuth(request)` — returns the authenticated user or throws 401.
  - `requireAdmin(request)` — returns the user if admin role, or throws 403.

## API Route Conventions

- All routes in `src/app/api/`.
- Use helpers from `lib/api.ts`: `json()`, `error()`, `requireAuth()`, `requireAdmin()`, `handleError()`.
- Return JSON with appropriate HTTP status codes.
- List endpoints support query parameters: `?search=`, `?category=`, `?sort=`, `?order=`, `?page=`, `?limit=`.
- Mutations require authentication; admin mutations require admin role.

### Route Template

```typescript
// src/app/api/<resource>/route.ts
import { prisma } from '@/lib/prisma';
import { json, error, requireAuth, handleError } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');

    const items = await prisma.item.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return json(items);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const item = await prisma.item.create({ data: { ...body, userId: user.id } });
    return json(item, 201);
  } catch (e) {
    return handleError(e);
  }
}
```

## Frontend Conventions

- Pages under `(public)/` are accessible without auth.
- Pages under `(app)/` require authentication (enforced by the group layout).
- Client state managed via React Context (`AuthContext`, `DataContext`).
- Favorites and similar features use optimistic updates with rollback on error.
- Progress/state syncs to the API on meaningful changes, not on every tick.

## Docker Compose

Standard services for every project:

| Service | Purpose |
|---|---|
| app | Next.js application |
| postgres | PostgreSQL database |
| object-storage | S3-compatible storage (MinIO) |
| storage-setup | Creates bucket + sets public policy (one-shot) |
| migrate-seed | Runs Prisma migrations + seed (one-shot) |

```bash
docker compose up --build -d    # Build and start
docker compose logs -f app      # View app logs
```

## User Registration & Seeding

- **Never seed admin users in production.** The seed script must check `NODE_ENV === "production"` and skip if true.
- Provide a `POST /api/auth/register` endpoint protected by `ADMIN_SETUP_TOKEN` (Bearer token from `.env`).
- If `ADMIN_SETUP_TOKEN` is not set, registration is disabled (return 403).
- The seed script may create a dev admin user for local development only.
- The server `docker-compose.server.yml` must set `NODE_ENV=production` on the `migrate-seed` service so seeds are skipped.

## Database Reset Script

Every project must include a `db-reset.sh` script at the root that drops and recreates the database inside the running Docker Compose stack (works with both `docker-compose.local.yml` and `docker-compose.server.yml`).

**This script is destructive — always ask the user for explicit confirmation before running it.**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Detect which compose file is active
if docker compose -f docker-compose.server.yml ps --quiet 2>/dev/null | head -1 | grep -q .; then
  COMPOSE_FILE="docker-compose.server.yml"
elif docker compose -f docker-compose.local.yml ps --quiet 2>/dev/null | head -1 | grep -q .; then
  COMPOSE_FILE="docker-compose.local.yml"
else
  echo "No running docker-compose stack found." && exit 1
fi

echo "Using $COMPOSE_FILE"
echo "This will DROP and recreate the database. All data will be lost."
read -rp "Are you sure? (yes/no): " CONFIRM
[[ "$CONFIRM" == "yes" ]] || { echo "Aborted."; exit 0; }

DB_SERVICE="postgres"
DB_NAME="${DB_NAME:-app}"

docker compose -f "$COMPOSE_FILE" exec "$DB_SERVICE" \
  psql -U postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
docker compose -f "$COMPOSE_FILE" exec "$DB_SERVICE" \
  psql -U postgres -c "CREATE DATABASE \"$DB_NAME\";"

echo "Database '$DB_NAME' has been reset."
echo "Restart the app or run 'npx prisma migrate deploy && npx tsx prisma/seed.ts' to re-apply migrations and seed."
```

Adjust `DB_NAME` to match the project's database name (or set it via env var).

## Adding New Features — Checklist

1. **New model**: Add to `prisma/schema.prisma`, run `npx prisma migrate dev --name <name>`.
2. **New API route**: Create `src/app/api/<resource>/route.ts`, use `requireAuth()`/`requireAdmin()`.
3. **New page**: Create `src/app/(app)/<page>/page.tsx` as `"use client"` component.
4. **New admin section**: Add tab to the admin page.
5. **File upload**: Use `POST /api/upload` with `FormData`, store returned URL in model.
