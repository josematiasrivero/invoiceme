---
name: seed
description: >
  Manage database seeding and migrations for the Archetype project.
  Covers Liquibase SQL changesets with contexts, Java ApplicationRunner
  seeders (DataSeeder for dev, RootUserInitializer for all environments),
  and how to add new seed data or migrations. Use when adding entities,
  changing the schema, or seeding reference/test data.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(./mvnw *), Bash(./test.sh)
argument-hint: [what to seed or migrate, e.g. "add seed data for X entity"]
---

# Database Seeding & Migrations

Apply the changes described in `$ARGUMENTS` following the conventions below.

## Overview of the two-layer seeding strategy

| Layer | File / Class | Runs in | Purpose |
|---|---|---|---|
| **Liquibase SQL** | `db/changelog/migrations/00N_*.sql` | Dev (context=`dev`) | Bulk reference data inserted at schema creation time |
| **Java ApplicationRunner** | `DataSeeder.java` | `dev` profile only | Admin user + dev tenant (idempotent, checks before inserting) |
| **Java ApplicationRunner** | `RootUserInitializer.java` | All environments | Break-glass root user with rotated password on every startup |

---

## Liquibase migrations

### Master changelog

```
backend/src/main/resources/db/changelog/db.changelog-master.yaml
```

Includes migration files in order:

```yaml
databaseChangeLog:
  - include:
      file: migrations/001_initial_schema.sql
      relativeToChangelogFile: true
  - include:
      file: migrations/002_seed_local_data.sql
      relativeToChangelogFile: true
  - include:
      file: migrations/003_roles_schema.sql
      relativeToChangelogFile: true
```

### Adding a new migration

1. Create `backend/src/main/resources/db/changelog/migrations/00N_<description>.sql`
   (increment `N` from the last file).
2. Add the `include` entry in `db.changelog-master.yaml`.
3. Restart the backend — Liquibase applies it automatically on startup.

### Changeset format

```sql
--liquibase formatted sql

--changeset <author>:<changeset-id> [context:<context>]
<SQL statement(s)>;

--rollback <SQL to undo>;   -- optional but recommended
```

**Important rules:**
- Use `context:dev` on any changeset that should only run in local development
  (seed data, dummy records). Omit the context for schema changes that apply to all envs.
- `<changeset-id>` must be unique across the entire project (convention: `NNN-<short-desc>`).
- Liquibase tracks applied changesets by (`id`, `author`, `filename`) in the
  `databasechangelog` table — never rename a file or change an applied changeset.

### Example — add a new entity table + seed row

```sql
--liquibase formatted sql

--changeset archetype:004-create-podcasts-table
CREATE TABLE podcasts (
    id          BIGSERIAL       PRIMARY KEY,
    uuid        VARCHAR(36)     NOT NULL UNIQUE,
    tenant_id   BIGINT          NOT NULL REFERENCES tenants(id),
    title       VARCHAR(255)    NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL,
    updated_at  TIMESTAMPTZ     NOT NULL
);

--changeset archetype:004-seed-podcasts context:dev
INSERT INTO podcasts (uuid, tenant_id, title, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0099-000000000001',
    (SELECT id FROM tenants WHERE uuid = 'a0000000-0000-0000-0000-000000000001'),
    'Sample Podcast',
    NOW(), NOW()
);
```

### UUID naming convention for seed data

All seed UUIDs follow the pattern:

```
a0000000-0000-0000-<entity-segment>-<sequence>
```

| Entity | Segment |
|---|---|
| Tenants | `0000` |
| Radio stations | `0001` |
| Shorts | `0002` |
| Carousels | `0003` |
| Schedule items | `0004` |

Use the next available sequence for new rows.

---

## Java ApplicationRunner seeders

### DataSeeder (dev only)

**File**: `src/main/java/com/adavance/archetype/DataSeeder.java`
**Annotation**: `@Profile("dev")` — only active when `spring.profiles.active=dev`
**Order**: default (`Integer.MAX_VALUE`) — runs after `RootUserInitializer`

Seeds:
- `Tenant` with slug `"default"` (idempotent: checks `tenantService.existsBySlug`)
- `Role` named `"Dev Full Access"` with pattern `".*"` (grants access to all endpoints)
- `User` `admin@example.com` / `changeme` with `UserRole.ADMIN`

Pattern for idempotent seeding:
```java
if (someService.existsBy<Field>(value)) {
    entity = someService.findBy<Field>(value);
    log.info("Already exists, skipping.");
} else {
    entity = new Entity();
    // … set fields …
    entity = someService.save(entity);
    log.info("Seeded: {}", entity);
}
```

### RootUserInitializer (all environments)

**File**: `src/main/java/com/adavance/archetype/RootUserInitializer.java`
**Annotation**: no `@Profile` — runs in every environment
**Order**: `@Order(1)` — runs first, before `DataSeeder`

Behaviour:
- Ensures a `"system"` tenant and `"Root"` role exist.
- Creates `root@adavance.com` on first start; **rotates its BCrypt password on every subsequent startup**.
- Logs the plaintext password at WARN level — only operators with log access can authenticate.

**Do not use** `root@adavance.com` for normal development — use `admin@example.com` instead.

### Adding a new ApplicationRunner seeder

```java
@Slf4j
@Component
@Profile("dev")           // omit for all-env seeders
@RequiredArgsConstructor
public class MySeeder implements ApplicationRunner {

    private final MyEntityService service;

    @Override
    public void run(ApplicationArguments args) {
        if (service.existsByName("my-fixture")) {
            log.info("MyFixture already exists, skipping.");
            return;
        }
        MyEntity e = new MyEntity();
        e.setName("my-fixture");
        service.save(e);
        log.info("Seeded MyFixture");
    }
}
```

---

## Dev database quick reference

| Item | Value |
|---|---|
| JDBC URL | `jdbc:h2:mem:archetype-dev;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH` |
| H2 Console | `http://localhost:8080/h2-console` |
| Username | `sa` |
| Password | *(empty)* |
| Liquibase context | `dev` |
| DDL mode | `none` (Liquibase owns schema) |

The database is **in-memory** — it is wiped on every restart and all migrations + seeders
run again from scratch.

---

## Production database

PostgreSQL is used in production.  Connection settings are supplied via environment variables:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/dbname
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
```

The `002_seed_local_data.sql` changesets are **not applied** in production because they
carry `context:dev`. Schema changesets (no context) are applied normally.
