---
name: test
description: >
  Run the test suite for the Archetype project (backend and/or frontend).
  Use when verifying changes, debugging test failures, or adding new tests.
  Covers backend JUnit 5 + JaCoCo coverage and frontend TypeScript validation.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(./mvnw *), Bash(./test.sh), Bash(cd frontend && pnpm *)
argument-hint: [optional: "backend", "frontend", or a specific test class name]
---

# Running Tests

Run the tests described in `$ARGUMENTS` following the conventions below.

## Backend tests

### Quick run

```bash
cd backend
./test.sh
```

`test.sh` runs `./mvnw clean test jacoco:report` and then prints a coverage
summary to stdout:

```
──────────────────────────────────────────────────────
  Coverage Summary
──────────────────────────────────────────────────────
  Instructions   ████████████░░░░░░░░   62.4%  (1240/1987)
  Branches       ██████████░░░░░░░░░░   52.1%  (125/240)
  Lines          ████████████░░░░░░░░   63.7%  (510/800)
  Methods        █████████████░░░░░░░   68.2%  (195/286)
  Classes        ██████████████████░░   89.5%  (51/57)
──────────────────────────────────────────────────────
```

### Run a single test class

```bash
cd backend
./mvnw test -Dtest=RadioStationServiceTest -pl .
```

### Run tests matching a pattern

```bash
cd backend
./mvnw test -Dtest="*Service*" -pl .
```

---

## Backend test conventions

> **Spring Boot 4.0 removed `@DataJpaTest`** — do not use it.

### Annotations by test type

| Test type | Annotation(s) |
|---|---|
| Repository layer | `@SpringBootTest(webEnvironment = NONE)` + `@Transactional` |
| Service layer | `@SpringBootTest(webEnvironment = NONE)` + `@Transactional` |
| Full HTTP integration | `@SpringBootTest` (default `MOCK` environment) |

`@Transactional` on the test class ensures each test method rolls back automatically —
no manual cleanup needed.

Call `repository.flush()` after saves when you need to verify DB constraints within the
same transaction.

### Test database

H2 in-memory with PostgreSQL compatibility mode, configured in
`src/test/resources/application.properties`:

```properties
spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH
spring.jpa.hibernate.ddl-auto=create-drop
```

Liquibase is **disabled** in tests (`spring.liquibase.enabled=false`).
Hibernate creates/drops the schema automatically from JPA entities.

### Example test

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Transactional
class RadioStationServiceTest {

    @Autowired RadioStationService service;
    @Autowired TenantService tenantService;

    @Test
    void findAll_returnsTenantScopedResults() {
        Tenant t = new Tenant();
        t.setName("Test"); t.setSlug("test");
        t = tenantService.save(t);

        RadioStation s = new RadioStation();
        s.setTenant(t);
        s.setName("My Station");
        s.setStreamUrl("https://example.com/stream");
        service.save(s);

        List<RadioStation> result = service.findAllByTenant(t.getId());
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("My Station");
    }
}
```

### Naming convention

Test class names: `<ClassName>Test`

---

## Frontend tests / type-check

The frontend has no dedicated test runner. TypeScript strict mode is verified via build:

```bash
cd frontend
pnpm build
```

All TypeScript type errors surface here. Fix all errors before finishing any frontend task.

For quick type checking without a full build:

```bash
cd frontend
pnpm exec tsc --noEmit
```

---

## CI pipeline

Tests run automatically via GitHub Actions on every PR and push to `main`:

```
.github/workflows/ci.yml
```

The workflow:
1. Sets up Java 21
2. Runs `./mvnw clean test jacoco:report`
3. Uploads JaCoCo reports as an artifact

The backend tests must pass before a PR can be merged.
