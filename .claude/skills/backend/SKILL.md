---
name: backend
description: >
  Implement Spring Boot backend features for the Archetype project.
  Use when creating or modifying entities, repositories, services,
  controllers, DTOs, or configuration. Covers REST API development,
  JPA modeling, multi-tenancy, and testing conventions.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(./mvnw *), Bash(./test.sh)
argument-hint: [feature or layer to implement]
---

# Backend Feature Implementation

Implement the backend feature described in `$ARGUMENTS` following the conventions below.

## Stack

- **Java 25** · Spring Boot 4.0.3
- **Spring Data JPA** + Hibernate 7 (bytecode enhancement removed — incompatible with Lombok in Hibernate 7)
- **Spring Security 7** — JWT stateless auth; `BCryptPasswordEncoder` for passwords
- **JJWT 0.12.6** (`jjwt-api` / `jjwt-impl` / `jjwt-jackson`) — JWT generation and validation
- **AspectJ** (`aspectjweaver`, version managed by Spring Boot BOM) — AOP for automatic tenant filtering. Note: `spring-boot-starter-aop` is NOT in the Spring Boot 4.0.3 BOM; use `org.aspectj:aspectjweaver` directly.
- **Lombok** — `@Getter` / `@Setter` on all entities. Must be declared in `maven-compiler-plugin` `annotationProcessorPaths` — Spring Boot 4 no longer auto-configures it from `<optional>true</optional>`
- **PostgreSQL** runtime driver · **H2** in-memory for tests (PostgreSQL compatibility mode)
- **springdoc-openapi 3.0.2** — Swagger UI at `http://localhost:8080/swagger-ui.html`
- **GraalVM native-image** via `native-maven-plugin`
- Root package: `com.adavance.archetype`

## Project Layout

```
src/main/java/com/adavance/archetype/
├── config/         # @Configuration classes (JpaConfig, SecurityConfig, TenantFilterAspect, etc.)
├── controller/     # @RestController (including AuthController)
├── security/       # TenantContext, JwtTokenProvider, JwtAuthenticationFilter, UserDetailsServiceImpl
├── service/        # @Service — generic base + concrete impls
├── repository/     # Spring Data JPA — generic base + concrete impls
├── model/          # @Entity + enums
├── dto/            # records: *Request / *Response (including LoginRequest/LoginResponse)
└── exception/      # custom exceptions + @RestControllerAdvice

src/test/
├── java/.../       # @SpringBootTest + @Transactional integration tests
└── resources/
    └── application.properties   # H2 datasource (PostgreSQL mode)
```

Config lives in `src/main/resources/application.yaml`
(profile overrides: `application-dev.yaml`, `application-prod.yaml`).

## Step-by-step

1. **Identify the layer(s)** the feature touches (model → repo → service → controller).
2. **Read existing code** in affected classes before writing anything new.
3. **Implement from the bottom up**: entity/DTO → repository → service → controller.
4. **Write or update tests** for any new public methods.
5. **Run `./test.sh`** from the `backend/` directory at the end of every task and fix any failures before finishing.

---

## Conventions

### Entities

- Extend `BaseEntity` (`com.adavance.archetype.model.BaseEntity`):
  - `Long id` · `String uuid` · `Instant createdAt` · `Instant updatedAt`
  - `BaseEntity` uses `@Getter` only — id/uuid/timestamps are JPA-managed, no setters.
- All domain entities **must also extend `TenantAwareEntity`** to inherit `tenant_id`.
  - Exception: `UserSettings` uses `@MapsId` (shared PK with `User`) — do **not** extend either base class.
- `@EnableJpaAuditing` lives in `config/JpaConfig.java` (not on the main application class, so tests can `@Import` it).
- Use `@Table(name = "...")` explicitly on every entity.
- Use `@Getter @Setter` (Lombok) on every entity class. `BaseEntity` uses `@Getter` only.
- Prefer `@ManyToOne` with `@JoinColumn` on the owning side; avoid bidirectional associations unless clearly necessary.
- Use `updatable = false` on fields that must never change after insert (e.g. `tenant_id`, `uuid`).

### DTOs

- Use Java `record` types for all request/response bodies.
- Naming: `*Request` (inbound), `*Response` (outbound).

### Repositories

Generic base interfaces (use `@NoRepositoryBean`):
- `BaseRepository<T extends BaseEntity, ID>` — extends `JpaRepository`, adds `findByUuid(String)`
- `TenantAwareRepository<T extends TenantAwareEntity, ID>` — extends `BaseRepository`, adds `findAllByTenantId(Long)` and `findByUuidAndTenantId(String, Long)`

Concrete repositories extend the appropriate base:
- Tenant → `BaseRepository`
- All other entities → `TenantAwareRepository`
- `UserSettings` → plain `JpaRepository<UserSettings, Long>` (no BaseEntity)

Prefer Spring Data derived query methods or `@Query` with JPQL. Avoid native SQL unless strictly necessary.

### Services

Generic base classes:
- `CrudService<T, ID>` — interface: `findById`, `findByUuid`, `findAll`, `save`, `update`, `deleteById`, `deleteByUuid`
- `TenantAwareCrudService<T, ID>` — extends `CrudService`, adds `findAllByTenant(Long)`, `findByUuidAndTenant(String, Long)`
- `AbstractCrudService<T, R>` — abstract implementation of `CrudService`; throws `ResourceNotFoundException` on misses
- `AbstractTenantAwareCrudService<T, R>` — extends `AbstractCrudService`, implements `TenantAwareCrudService`

Concrete services:
- Annotate with `@Service` and `@Transactional(readOnly = true)`.
- Extend `AbstractCrudService` (for `Tenant`) or `AbstractTenantAwareCrudService` (for all tenant-scoped entities).
- Add domain-specific query methods by delegating to the injected `repository`.
- Throw `ResourceNotFoundException` (caught by `GlobalExceptionHandler`) for missing entities.

### Controllers

- Base path: `/api/v1/...`
- Use `@Tag(name = "...")` and `@Operation(summary = "...")` for OpenAPI docs.
- Always return `ResponseEntity<T>` with explicit HTTP status codes.
- Swagger UI: `http://localhost:8080/swagger-ui.html`

Generic base controllers (mirror the service hierarchy):
- `AbstractCrudController<T, Req, Resp>` — implements GET `/`, GET `/{uuid}`, POST `/`, PUT `/{uuid}`, DELETE `/{uuid}` via `service()`, `toResponse()`, `toEntity()`, `updateEntity()` hooks.
- `AbstractTenantAwareCrudController<T, Req, Resp>` — same CRUD but **tenant is resolved from `TenantContext` (JWT), not a path variable**. Injects `TenantService` for the `currentTenant()` helper. `toEntity` receives the resolved `Tenant`.

Concrete controllers:
- Annotate with `@RestController`, `@RequestMapping("/api/v1/...")`, and `@Tag(name = "...")`.
- **No `{tenantUuid}` path segment** — the tenant comes from the JWT via `TenantContext.getCurrentTenantId()`.
- Use `@RequiredArgsConstructor` for constructor injection.
- Extend `AbstractCrudController` (for `Tenant`) or `AbstractTenantAwareCrudController` (for tenant-scoped entities).
- Override base methods (with `@GetMapping` etc.) when entity-specific behavior is needed (e.g. `CarouselController.findAll` uses display-order sort).
- Add extra endpoints (e.g. `/top`, `/by-genre`) as additional `@GetMapping`/`@PostMapping` methods; use `TenantContext.getCurrentTenantId()` directly for tenant-scoped queries.
- Use `params = "key"` on `@GetMapping` to expose optional query-param filters without conflicting with the inherited `findAll` handler.
- ScheduleItems (`/api/v1/stations/{stationUuid}/schedule`) and UserSettings (`/api/v1/users/{userUuid}/settings`) have standalone controllers nested under their parent resource.

### Auth & Security

- **Authentication**: `POST /api/v1/auth/login` → returns a JWT (`LoginResponse`). All other endpoints require `Authorization: Bearer <token>`.
- **JWT**: generated by `JwtTokenProvider`; contains `sub` (email), `tenantId` (Long), `role` (String). Validated on every request by `JwtAuthenticationFilter`.
- **Tenant context**: `JwtAuthenticationFilter` extracts `tenantId` from the JWT and stores it in `TenantContext` (ThreadLocal) for the duration of the request.
- **Password hashing**: use `PasswordEncoder` (BCrypt, injected from `SecurityConfig`) — call `passwordEncoder.encode(request.password())` in `UserController.toEntity` and `updateEntity`. The `UserRequest` DTO uses `password` (plain), never `passwordHash`.
- **Role-based access — centralized at the service layer via AOP**:
  - `SecurityConfig` only enforces authentication (`anyRequest().authenticated()`); public endpoints (auth, Swagger, H2 console, public GET routes) are `permitAll()`. **Do NOT add `hasRole`/`hasAnyRole` rules for specific API endpoints** — use the AOP system instead.
  - `RoleAccessAspect` (`@Order(2)`) intercepts every method in `com.adavance.archetype.service.*.*` and checks whether the method identifier (`ClassName.methodName`) matches any pattern in `RoleContext.getAllowedPatterns()`.
  - Patterns are stored on the `Role` entity (`role_permissions` table) as Java regex strings, e.g. `RadioStationService\..*`, `UserService\..*`, `.*`.
  - `UserPermissionLoader` resolves the effective patterns for the current user: explicit service role patterns take priority; if no service role is assigned, default patterns are derived from the user's `UserRole` enum (`ROOT` → unrestricted/null, `ADMIN` → content + user + tenant services, `CONTENT_MANAGER` → content services only).
  - `RootOrganizationService` (cross-tenant org management) is only accessible when patterns include `.*` (ROOT users).
  - **Rank enforcement**: `UserController.validateRoleRank()` prevents a user from creating/updating users with a more-privileged `UserRole` than their own. **Lower rank value = more privileges** (ROOT = 0 is most privileged). The guard throws 403 when `targetRole.getRank() < currentUserRole.getRank()`.
- **Three user roles** (`UserRole` enum — lower rank value = more privileges):
  - `ROOT` (rank 0) — unrestricted (all service methods; `getDefaultPatterns()` returns `null`)
  - `ADMIN` (rank 1) — content + user management + tenant management
  - `CONTENT_MANAGER` (rank 2) — content services only
- **No role seeding**: default patterns are embedded directly in the `UserRole` enum. Users without an explicit service `Role` assigned fall back to their `UserRole.getDefaultPatterns()`. Explicit `Role` entities can be assigned for fine-grained overrides (service role takes priority over enum defaults).
- **Spring Security 7 API notes**:
  - `DaoAuthenticationProvider` constructor takes `UserDetailsService` directly: `new DaoAuthenticationProvider(userDetailsService)`.
  - Use lambda DSL for `HttpSecurity`: `.csrf(csrf -> csrf.disable())`, `.authorizeHttpRequests(auth -> auth...)`.

### Automatic Tenant Filtering (Hibernate Filter)

`TenantAwareEntity` declares a Hibernate `@FilterDef` named `tenantFilter` (parameter: `tenantId`) and `@Filter(condition = "tenant_id = :tenantId")`. The filter is enabled automatically for every service call via `TenantFilterAspect` (`@Order(1)`, runs inside `@Transactional` which is at order 0 via `@EnableTransactionManagement(order=0)` in `JpaConfig`).

- When `TenantContext` is populated (normal HTTP requests), **all Spring Data derived queries on tenant-aware entities are automatically filtered** — no need to call `findAllByTenantId(tenantId)` explicitly.
- When `TenantContext` is empty (tests, DataSeeder), the filter is not applied; service methods with explicit `tenantId` parameters continue to work normally.
- The existing `findAllByTenantId` / `findByUuidAndTenantId` repository methods are kept as defence-in-depth and for use in tests.

### Tests

> **Spring Boot 4.0 removed `@DataJpaTest`** — do not use it.

| Scenario | Annotation |
|---|---|
| Repository layer | `@SpringBootTest(webEnvironment = NONE)` + `@Transactional` |
| Service layer | `@SpringBootTest(webEnvironment = NONE)` + `@Transactional` |
| Full integration | `@SpringBootTest` |

- `@Transactional` on the test class ensures each test rolls back automatically — no manual cleanup needed.
- Call `repository.flush()` after saves when you need to verify DB constraints within the same transaction.
- H2 is configured in `src/test/resources/application.properties` with PostgreSQL compatibility mode:
  ```
  spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH
  spring.jpa.hibernate.ddl-auto=create-drop
  ```
- Test class naming: `<ClassName>Test`.

---

## Running locally

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

This activates the `dev` profile which uses H2 in-memory (PostgreSQL compatibility mode) — no PostgreSQL needed locally.
H2 console is available at `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:archetype-dev`, user: `sa`, no password).

## Running tests

```bash
cd backend
./test.sh
```

## Native image

```bash
./mvnw -Pnative native:compile
```

Reflection/proxy hints go in `src/main/resources/META-INF/native-image/`.
