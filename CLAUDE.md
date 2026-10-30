# CLAUDE.md

Rules for working in this NestJS API (NestJS 11, TypeORM + PostgreSQL, BullMQ, Redis, Jest).

## Commands

- `npm run start:dev` — run in watch mode
- `npm run test` / `npm run test:cov` — unit tests (Jest, coverage threshold 70%)
- `npm run lint` / `npm run format:write` — ESLint + Prettier
- `npm run check` — format check + lint check + tests with coverage (run before finishing a task)
- `npm run migration:run` / `npm run migration:revert` — TypeORM migrations (`src/core/db/data-source.ts`)

## 1. NestJS best practices

- **Layering**: Controller → Service → Repository. No skipping layers.
  - **Controllers** are thin: routing, guards, decorators, DTO input, Swagger docs. No business logic, no direct DB access.
  - **Services** hold business logic and orchestrate repositories / other services.
  - **Repositories** are the only place that talks to TypeORM (`Repository`, `QueryBuilder`).
- **Dependency injection** everywhere. Never instantiate injectable classes with `new`; register them as providers and inject via constructor (`private readonly`).
- **Modules** encapsulate a feature. Export only what other modules actually need; import modules, not individual providers from another module.
- **DTOs** for every request body / query / params, validated with `class-validator` and transformed with `class-transformer`. Document them with `@nestjs/swagger` decorators (`@ApiProperty`, `@ApiPropertyOptional`).
- **Errors**: throw built-in Nest exceptions (`NotFoundException`, `BadRequestException`, `ConflictException`, `ForbiddenException`, ...). Never return error objects or raw strings.
- **Configuration**: read env values via `ConfigService` (`@nestjs/config`), never `process.env` directly inside services. Add new variables to `.env.example`.
- **Auth**: protect routes with existing guards (`JwtAuthGuard`, `RolesGuard`) and decorators from `modules/user`. Split admin and client endpoints into `admin/` and `client/` subfolders when both exist.
- **Database**: schema changes only through migrations in `src/core/db/migrations`. Never rely on `synchronize`.
- **Async work** (emails, heavy jobs) goes through BullMQ queues (`core/queue`) and processors, not inline in request handlers.
- Keep methods small and single-purpose; prefer early returns; use `async/await`, not raw promise chains.
- Strict typing: no `any` in production code (allowed in tests only when unavoidable). Always declare return types of public methods.

## 2. Folder structure

```
src/
├── main.ts
├── app.module.ts
├── core/          # Core / infrastructure functionality shared across the app
│   ├── cache/
│   ├── db/        # data-source, migrations, seeders, helpers
│   ├── mail/
│   └── queue/
└── modules/       # Feature (domain) modules
    ├── catalog/
    ├── orders/
    ├── settings/
    ├── statistic/
    └── user/
```

- **`src/core/`** — infrastructure and cross-cutting functionality: DB, cache, mail, queues, global filters/interceptors/pipes, shared config. No domain/business logic here.
- **`src/modules/`** — feature modules (business domains). Each feature gets its own folder with a `<name>.module.ts` at its root.

## 3. Inside a core or feature module

Split code by responsibility into separate folders and separate files. One class / concern per file.

```
modules/<feature>/
├── <feature>.module.ts
├── constants/      # <name>.constants.ts      — constant values, tokens, defaults
├── controllers/    # <name>/<name>.controller.ts (+ admin/ & client/ subfolders when needed)
├── services/       # <name>/<name>.service.ts
├── repositories/   # <name>/<name>.repository.ts
├── dto/            # <name>/<action>-<name>.dto.ts
├── entities/       # <name>.entity.ts, enums/<name>.enum.ts
├── models/         # <name>.models.ts          — types only
├── helpers/        # <name>/<name>.helpers.ts  — pure functions
├── guards/  decorators/  processors/           — <name>/<name>.<type>.ts, when the module needs them
```

- Every testable file (controllers, services, repositories, helpers, guards, decorators, processors) lives in its own `<name>/` folder together with its `<name>.<type>.spec.ts`. Never put them flat in the type folder.
- Only create folders that are needed; follow the existing modules (e.g. `modules/catalog`) as the reference.
- No magic numbers / strings inline — put them in `constants/`.
- Pure, reusable logic goes in `helpers/` as exported functions (easy to unit test).
- Types go in `models/`, never declared inline inside services or controllers if reused.
- File names are kebab-case with a type suffix: `product-query.constants.ts`, `slug.helpers.ts`, `tags.service.ts`.

## 4. Types only

- Use `type` aliases, **not** `interface`:
  ```ts
  export type TagFilters = {
    shopId?: string;
    name?: string;
  };
  ```
- Classes are reserved for Nest building blocks that need runtime metadata: modules, controllers, services, repositories, guards, DTOs, entities.
- Prefer union / `as const` types over new TS `enum`s for non-entity values; existing entity enums in `entities/enums/` stay as they are.
- Use utility types (`Pick`, `Omit`, `Partial`, `Readonly`) instead of duplicating shapes.

## 5. Unit tests

- Write unit tests wherever possible: services, repositories, controllers, helpers, guards, processors.
- Tests are Jest, files sit next to the code: `<name>.spec.ts`.
- Use `Test.createTestingModule` from `@nestjs/testing` and mock all dependencies with `{ provide: X, useValue: mock }` and `jest.fn()`. Override guards with `.overrideGuard(...)`.
- Cover the happy path, edge cases, and thrown exceptions (`await expect(...).rejects.toThrow(NotFoundException)`).
- Test behavior, not implementation details; assert both return values and calls on mocked dependencies (`toHaveBeenCalledWith`).
- Excluded from coverage (no tests required): `main.ts`, `*.module.ts`, `entities/`, `dto/`, `models/`, `constants/`, `*.enum.ts`, `core/`.
- After changes, run `npm run check` and make sure everything passes and coverage stays ≥ 70%.
