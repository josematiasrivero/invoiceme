---
name: railway
description: >
  Deploy the Archetype project to Railway and manage CI/CD pipelines.
  Use when deploying backend or frontend services, configuring environment
  variables, setting up GitHub Actions workflows, or troubleshooting Railway
  deployments.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(git *), Bash(railway *), Bash(npm install -g @railway/cli)
argument-hint: [deploy | cicd | env | status | logs | troubleshoot]
---

# Railway Deployment & CI/CD

Handle the task described in `$ARGUMENTS` following the conventions below.

## Architecture Overview

The project deploys two independent Railway services from a single GitHub repository (monorepo):

| Service    | Source dir  | Builder    | Port |
|------------|-------------|------------|------|
| `backend`  | `backend/`  | Dockerfile (`Dockerfile.jvm`) | 8080 |
| `frontend` | `frontend/` | Nixpacks   | `$PORT` (Railway-assigned) |

Both services live in the same Railway **project** and share the same **`production` environment**.

---

## Railway Config Files

### `backend/railway.toml`
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile.jvm"

[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

### `frontend/railway.toml`
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "next start -p $PORT"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
```

> **Never change `startCommand` for the frontend** — `$PORT` is injected by Railway at runtime and Next.js must bind to it.

---

## Required Environment Variables

Set these in the Railway dashboard under each service → **Variables** tab.

### Backend service
| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL (e.g. `jdbc:postgresql://...`) |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `APP_JWT_SECRET` | JWT signing secret (min 64 chars, random) |
| `SPRING_PROFILES_ACTIVE` | Must be `prod` |

### Frontend service
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend public URL (e.g. `https://backend.railway.app`) |

> **Note:** Railway injects `PORT` automatically — do not set it manually.

### Linking the PostgreSQL database
Railway can provision a managed PostgreSQL add-on. After adding it to the project:
1. Go to the Postgres service → **Connect** tab → copy the connection string.
2. Set `SPRING_DATASOURCE_URL` on the backend service using the Railway internal URL (private network, faster + free).
3. Use `${{Postgres.DATABASE_URL}}` reference variables in Railway to auto-wire them.

---

## GitHub Actions CI/CD

### CI workflow (`.github/workflows/ci.yml`)
Triggers on every push to `main` and every PR targeting `main`:
- Sets up Java 25 (Oracle distribution)
- Runs `./test.sh` in `backend/` (JUnit 5 + JaCoCo coverage)
- Uploads the JaCoCo HTML report as a build artifact (14-day retention)

### Deploy workflow (`.github/workflows/deploy-railway.yml`)
Triggers on push to `main` (and manual `workflow_dispatch`):
- Installs Railway CLI (`@railway/cli`)
- Deploys backend and frontend **in parallel** as independent jobs
- Uses `--detach` so the workflow finishes immediately; Railway streams build logs in its own dashboard

**Required GitHub secret:**

| Secret | Where to get it |
|---|---|
| `RAILWAY_TOKEN` | Railway dashboard → Project Settings → Tokens → **New Token** |

Add it under: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**.

---

## Step-by-step: First Deploy

1. **Create a Railway project** at [railway.app](https://railway.app) → New Project → Empty Project.

2. **Add two services** (+ New Service → Empty Service) named exactly `backend` and `frontend`.

3. **Link each service to the GitHub repo**:
   - Service Settings → Source → Connect Repo → select the monorepo
   - Set **Root Directory** to `backend/` or `frontend/` respectively

4. **Add a PostgreSQL database** (+ New Service → Database → PostgreSQL).

5. **Set all environment variables** listed above on each service.

6. **Create a Railway project token** (Project Settings → Tokens) and add it as the `RAILWAY_TOKEN` GitHub secret.

7. **Push to `main`** — GitHub Actions will run CI tests, then deploy both services automatically.

---

## Deploying Manually (Railway CLI)

Install the CLI once:
```bash
npm install -g @railway/cli
railway login
```

Deploy from the monorepo root:
```bash
# Deploy backend
cd backend
railway up --service backend --environment production

# Deploy frontend
cd ../frontend
railway up --service frontend --environment production
```

Use `--detach` to return immediately without streaming logs:
```bash
railway up --service backend --environment production --detach
```

---

## Checking Status & Logs

```bash
# List services and their current status
railway status

# Stream logs for a specific service
railway logs --service backend
railway logs --service frontend

# Open the Railway dashboard in the browser
railway open
```

---

## Troubleshooting

### Build fails on backend
- Check that `backend/Dockerfile.jvm` exists and is valid.
- Verify `railway.toml` sets `dockerfilePath = "Dockerfile.jvm"`.
- Railway must be pointed at the `backend/` root directory (not the repo root).
- If the Maven build runs out of memory, add `MAVEN_OPTS=-Xmx512m` as a Railway variable.

### Frontend shows "Application failed to respond"
- Confirm `startCommand = "next start -p $PORT"` in `frontend/railway.toml`.
- Ensure `next build` succeeds locally: `cd frontend && pnpm build`.
- Check that `NEXT_PUBLIC_API_BASE_URL` is set and points to the backend Railway URL.

### API calls fail (CORS / 401 errors)
- Verify `NEXT_PUBLIC_API_BASE_URL` does **not** have a trailing slash.
- Confirm `SPRING_PROFILES_ACTIVE=prod` on the backend (enables production CORS config).
- Ensure `APP_JWT_SECRET` is identical across all backend instances (stateless JWT).

### Deployment not triggered by push
- Confirm `RAILWAY_TOKEN` secret is set in GitHub repo settings.
- Check the **Actions** tab for workflow errors.
- Verify the service name in `railway up --service <name>` matches exactly what is in the Railway dashboard (case-sensitive).

### Database connection refused
- Use the **private** Railway internal URL for `SPRING_DATASOURCE_URL` (not the public URL).
- Check that the PostgreSQL service is in the same Railway project.
- Confirm `SPRING_DATASOURCE_USERNAME` / `PASSWORD` match the Railway Postgres credentials.

---

## Updating the CI/CD Pipeline

When modifying `.github/workflows/`:
- `ci.yml` — keep Java version in sync with `backend/pom.xml` (`<java.version>`).
- `deploy-railway.yml` — service names (`--service backend`, `--service frontend`) must match Railway dashboard names exactly.
- Test workflow changes by pushing to a feature branch and triggering `workflow_dispatch` manually on the Actions tab before merging to `main`.

---

## Docker Image (JVM)

The backend uses a two-stage JVM Dockerfile (`Dockerfile.jvm`):
1. **Build stage**: `eclipse-temurin:21-jdk-jammy` — runs `./mvnw -B package -DskipTests`
2. **Runtime stage**: `eclipse-temurin:21-jre-jammy` — runs the JAR with `SPRING_PROFILES_ACTIVE=prod`

To build and test the Docker image locally:
```bash
cd backend
docker build -f Dockerfile.jvm -t archetype-backend:local .
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/archetype \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=postgres \
  -e APP_JWT_SECRET=your-secret-here \
  archetype-backend:local
```

> The GraalVM native `Dockerfile` exists but is disabled in CI — only use it if you specifically need a native binary.
