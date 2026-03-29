# InvoiceMe

Simple invoicing app for managing clients, providers, and invoices with PDF generation.

## Stack

- **Next.js 16** (App Router, Server Actions)
- **Prisma** (PostgreSQL)
- **JWT cookie auth** (jose + bcryptjs)
- **Docker Compose** (app, postgres, pgweb)

## Quick Start

```bash
./run.sh
```

This will:
1. Create the postgres data directory at `/mnt/data/apps/invoiceme/postgres`
2. Build and start all services via Docker Compose

### Services

| Service  | URL                      |
|----------|--------------------------|
| App      | http://localhost:6000     |
| pgweb    | http://localhost:6011     |
| Postgres | localhost:6014            |

## Configuration

Copy `.env.example` and set your values:

```bash
cp .env.example .env
```

| Variable       | Description                                      |
|----------------|--------------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string                     |
| `AUTH_SECRET`  | Secret key for signing JWT session cookies       |
| `ADMIN_TOKEN`  | Bearer token required for the registration route |

## Creating a User

Registration is protected by the `ADMIN_TOKEN` env var. With the services running:

```bash
curl -X POST http://localhost:6000/api/register \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <your-admin-token>' \
  -d '{"email":"you@example.com","password":"<your-password>"}'
```

Then sign in at http://localhost:6000/login.

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start dev server (port 3010)
npm run dev
```

## Docker Compose Services

```yaml
postgres   # PostgreSQL 17 — data persisted to /mnt/data/apps/invoiceme/postgres
pgweb      # Web-based Postgres UI
app        # Next.js standalone build, runs migrations on startup
```

### Useful Commands

```bash
# View logs
docker compose logs -f

# Run migrations manually
docker compose exec app npx prisma migrate deploy

# Stop everything
docker compose down
```
