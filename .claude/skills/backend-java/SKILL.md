---
name: backend-java
description: >
  Spring Boot backend conventions: JPA entities, repositories, services,
  controllers, DTOs, JWT auth, multi-tenancy, Liquibase migrations,
  database seeding, and JUnit 5 testing. Use for Java backend development.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(./mvnw *), Bash(./test.sh)
argument-hint: [feature, layer, or task to implement]
---

# Backend Java — Spring Boot Feature Implementation

Implement the feature described in `$ARGUMENTS` following the conventions below.

## Stack

- **Java 25** · Spring Boot 4
- **Spring Data JPA** + Hibernate 7
- **Spring Security 7** — JWT stateless auth; `BCryptPasswordEncoder` for passwords
- **JJWT** (`jjwt-api` / `jjwt-impl` / `jjwt-jackson`) — JWT generation and validation
- **AspectJ** — AOP for automatic tenant filtering
- **Lombok** — `@Getter` / `@Setter` on entities. Must be in `maven-compiler-plugin` `annotationProcessorPaths` (Spring Boot 4 no longer auto-configures it)
- **PostgreSQL** runtime driver · **H2** in-memory for tests (PostgreSQL compatibility mode)
- **springdoc-openapi** — Swagger UI
- **Liquibase** — database migrations
- **JUnit 5** + **JaCoCo** — testing and coverage

## Project Layout

```
src/main/java/<root-package>/
├── config/         # @Configuration (JpaConfig, SecurityConfig, TenantFilterAspect, etc.)
├── controller/     # @RestController
├── security/       # TenantContext, JwtTokenProvider, JwtAuthenticationFilter
├── service/        # @Service — generic base + concrete implementations
├── repository/     # Spring Data JPA — generic base + concrete implementations
├── model/          # @Entity + enums
├── dto/            # records: *Request / *Response
└── exception/      # custom exceptions + @RestControllerAdvice

src/main/resources/
├── application.yaml           # Main config
├── application-dev.yaml       # Dev profile (H2 in-memory)
├── application-prod.yaml      # Production profile
└── db/changelog/              # Liquibase migrations
    ├── db.changelog-master.yaml
    └── migrations/

src/test/
├── java/.../                  # @SpringBootTest + @Transactional tests
└── resources/
    └── application.properties # H2 datasource (PostgreSQL mode)
```

## Step-by-step

1. **Identify the layer(s)** the feature touches (model -> repo -> service -> controller).
2. **Read existing code** in affected classes before writing anything new.
3. **Implement from the bottom up**: entity/DTO -> repository -> service -> controller.
4. **Write or update tests** for any new public methods.
5. **Run tests** at the end of every task and fix any failures before finishing.

---

## Conventions

### Entities

- Extend `BaseEntity` (id, uuid, createdAt, updatedAt). `BaseEntity` uses `@Getter` only — timestamps are JPA-managed.
- Tenant-scoped entities extend `TenantAwareEntity` to inherit `tenant_id`.
- `@EnableJpaAuditing` in a `@Configuration` class (not on the main application class).
- Use `@Table(name = "...")` explicitly on every entity.
- Use `@Getter @Setter` (Lombok) on entity classes.
- Prefer `@ManyToOne` with `@JoinColumn` on the owning side; avoid bidirectional associations unless necessary.
- Use `updatable = false` on immutable fields (e.g., `tenant_id`, `uuid`).

### DTOs

- Use Java `record` types for all request/response bodies.
- Naming: `*Request` (inbound), `*Response` (outbound).

### Repositories

Generic base interfaces (use `@NoRepositoryBean`):
- `BaseRepository<T extends BaseEntity, ID>` — extends `JpaRepository`, adds `findByUuid(String)`
- `TenantAwareRepository<T extends TenantAwareEntity, ID>` — extends `BaseRepository`, adds `findAllByTenantId(Long)` and `findByUuidAndTenantId(String, Long)`

Concrete repositories extend the appropriate base. Prefer Spring Data derived query methods or `@Query` with JPQL over native SQL.

### Services

Generic base classes:
- `CrudService<T, ID>` — interface: `findById`, `findByUuid`, `findAll`, `save`, `update`, `deleteById`, `deleteByUuid`
- `TenantAwareCrudService<T, ID>` — extends `CrudService`, adds tenant-scoped methods
- `AbstractCrudService<T, R>` — abstract implementation; throws `ResourceNotFoundException` on misses
- `AbstractTenantAwareCrudService<T, R>` — extends `AbstractCrudService` for tenant-scoped entities

Concrete services:
- Annotate with `@Service` and `@Transactional(readOnly = true)`.
- Extend the appropriate abstract base class.
- Add domain-specific query methods by delegating to the injected repository.

### Controllers

- Base path: `/api/v1/...`
- Use `@Tag(name = "...")` and `@Operation(summary = "...")` for OpenAPI docs.
- Always return `ResponseEntity<T>` with explicit HTTP status codes.

Generic base controllers:
- `AbstractCrudController<T, Req, Resp>` — GET `/`, GET `/{uuid}`, POST `/`, PUT `/{uuid}`, DELETE `/{uuid}` via `service()`, `toResponse()`, `toEntity()`, `updateEntity()` hooks.
- `AbstractTenantAwareCrudController<T, Req, Resp>` — same CRUD but tenant resolved from JWT (not a path variable).

Concrete controllers:
- `@RestController`, `@RequestMapping("/api/v1/...")`, `@Tag(name = "...")`.
- `@RequiredArgsConstructor` for constructor injection.
- Override base methods when entity-specific behavior is needed.
- Use `params = "key"` on `@GetMapping` for optional query-param filters.

### Auth & Security

- **Authentication**: `POST /api/v1/auth/login` -> returns a JWT. All other endpoints require `Authorization: Bearer <token>`.
- **JWT**: contains `sub` (email), `tenantId`, `role`. Validated on every request by `JwtAuthenticationFilter`.
- **Tenant context**: `JwtAuthenticationFilter` extracts `tenantId` from JWT and stores in `TenantContext` (ThreadLocal).
- **Password hashing**: `PasswordEncoder` (BCrypt) — encode in controller's `toEntity`/`updateEntity`.
- **Role-based access via AOP**: `RoleAccessAspect` intercepts service methods and checks against role permission patterns stored as regex strings. Centralize role logic at the service layer, not in `SecurityConfig`.
- **Spring Security 7 API**: `DaoAuthenticationProvider(userDetailsService)` constructor. Lambda DSL for `HttpSecurity`.

### Automatic Tenant Filtering (Hibernate Filter)

`TenantAwareEntity` declares a Hibernate `@FilterDef` + `@Filter(condition = "tenant_id = :tenantId")`. A `TenantFilterAspect` enables the filter automatically for every service call when `TenantContext` is populated.

- Normal HTTP requests: all queries on tenant-aware entities are automatically filtered.
- Tests / seeders (no TenantContext): filter not applied; use explicit tenant parameters.

---

## Database Migrations (Liquibase)

### Master Changelog

`src/main/resources/db/changelog/db.changelog-master.yaml` includes migration files in order:

```yaml
databaseChangeLog:
  - include:
      file: migrations/001_initial_schema.sql
      relativeToChangelogFile: true
```

### Adding a New Migration

1. Create `migrations/<next-number>_<description>.sql` (increment from the last file).
2. Add the `include` entry in `db.changelog-master.yaml`.
3. Restart the backend — Liquibase applies it on startup.

### Changeset Format

```sql
--liquibase formatted sql

--changeset <author>:<changeset-id> [context:<context>]
<SQL>;

--rollback <SQL to undo>;
```

**Rules:**
- Use `context:dev` for seed data that should only run locally. Omit context for schema changes.
- Changeset IDs must be unique across the project (convention: `NNN-<short-desc>`).
- Never rename a file or modify an already-applied changeset.

---

## Database Seeding

### User Registration in Production

- **Never seed admin users in production.** Use `@Profile("dev")` on seeders that create users.
- Provide a `POST /api/v1/auth/register` endpoint protected by `ADMIN_SETUP_TOKEN` (Bearer token from environment).
- If `ADMIN_SETUP_TOKEN` is not configured, registration must return 403.
- The production `application-prod.yaml` must not activate the `dev` profile, ensuring seeders are skipped.

### Two-Layer Strategy

| Layer | Runs in | Purpose |
|---|---|---|
| Liquibase SQL (`context:dev`) | Dev only | Bulk reference data at schema creation time |
| Java `ApplicationRunner` | Configurable via `@Profile` | Admin users, tenants, roles (idempotent) |

### ApplicationRunner Pattern

```java
@Slf4j
@Component
@Profile("dev")           // omit for all-environment seeders
@RequiredArgsConstructor
public class MySeeder implements ApplicationRunner {

    private final MyEntityService service;

    @Override
    public void run(ApplicationArguments args) {
        if (service.existsByName("fixture")) {
            log.info("Already exists, skipping.");
            return;
        }
        MyEntity e = new MyEntity();
        e.setName("fixture");
        service.save(e);
        log.info("Seeded fixture");
    }
}
```

**Idempotent seeding**: Always check `existsBy<Field>()` before inserting.

---

## Testing

> **Spring Boot 4 removed `@DataJpaTest`** — do not use it.

### Annotations by Test Type

| Scenario | Annotation |
|---|---|
| Repository layer | `@SpringBootTest(webEnvironment = NONE)` + `@Transactional` |
| Service layer | `@SpringBootTest(webEnvironment = NONE)` + `@Transactional` |
| Full HTTP integration | `@SpringBootTest` |

- `@Transactional` ensures each test rolls back automatically.
- Call `repository.flush()` after saves to verify DB constraints within the same transaction.

### Test Database

H2 in-memory with PostgreSQL compatibility mode in `src/test/resources/application.properties`:

```properties
spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH
spring.jpa.hibernate.ddl-auto=create-drop
spring.liquibase.enabled=false
```

### Example Test

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Transactional
class ProductServiceTest {

    @Autowired ProductService service;
    @Autowired TenantService tenantService;

    @Test
    void findAll_returnsTenantScopedResults() {
        Tenant t = new Tenant();
        t.setName("Test"); t.setSlug("test");
        t = tenantService.save(t);

        Product p = new Product();
        p.setTenant(t);
        p.setName("Item");
        service.save(p);

        List<Product> result = service.findAllByTenant(t.getId());
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Item");
    }
}
```

### Running Tests

```bash
./test.sh                              # Full suite + coverage
./mvnw test -Dtest=ProductServiceTest  # Single class
./mvnw test -Dtest="*Service*"         # Pattern match
```

### Naming

Test class names: `<ClassName>Test`.

---

## Running Locally

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Dev profile uses H2 in-memory (PostgreSQL compatibility mode) — no external database needed. H2 console available at `/h2-console`.
