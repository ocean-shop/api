---
paths:
  - "src/**/*.ts"
---

# Architecture rules

## Layers

```
HTTP → Controller → Service → Repository → TypeORM / Postgres
```

| Layer | Does | Never does |
| --- | --- | --- |
| Controller | routing, guards, `@Roles`, DTO input, `ParseUUIDPipe`, Swagger docs, read `request.user` | business logic, DB access, try/catch |
| Service | business rules, orchestration of repositories/services, mapping DB errors to Nest exceptions, cache invalidation, enqueueing jobs | `Repository<T>` / `QueryBuilder` |
| Repository | all TypeORM calls, query building, transactions, `NotFoundException` on `findById`-style lookups | business decisions |

Don't skip layers (controller → repository is forbidden).

## Folder layout

```
src/
├── main.ts                # bootstrap: CORS, ValidationPipe, Swagger, cookie-parser
├── app.module.ts          # ConfigModule (global), TypeORM, core + feature modules
├── core/                  # infrastructure, no domain logic
│   ├── cache/             # Redis response cache (CacheService.wrap / invalidate)
│   ├── config/            # app env constants (APP_ENV, CORS allowlists)
│   ├── db/                # data-source, migrations, seeders, QueryFailedError helpers
│   ├── mail/              # Resend + Handlebars templates (assets/templates/emails)
│   ├── queue/             # BullMQ registration (only when EMAIL_QUEUE_ENABLED=true)
│   └── response/          # pagination + list response helpers/types
└── modules/
    ├── catalog/           # shops, categories, tags, attributes, products, variations, images, favorites
    ├── orders/            # orders, order emails, statuses
    ├── settings/          # cache admin
    ├── statistic/         # shop statistics
    └── user/              # auth (OTP, JWT, sessions), users, admins, profile, shipping, roles/guards
```

Inside a feature module (only create folders that are needed):

```
modules/<feature>/
├── <feature>.module.ts
├── constants/      <name>.constants.ts
├── controllers/    <name>/[admin|client]/<name>.controller.ts (+ .spec.ts)
├── services/       <name>/[admin|client|common]/<name>.service.ts (+ .spec.ts)
├── repositories/   <name>/[admin|client|common]/<name>.repository.ts (+ .spec.ts)
├── dto/            <name>/<action>-<name>.dto.ts
├── entities/       <name>.entity.ts, enums/<name>.enum.ts
├── models/         <name>.models.ts            (types only)
├── helpers/        <name>/<name>.helpers.ts     (pure functions + .spec.ts)
└── guards/ decorators/ processors/   <name>/<name>.<type>.ts (+ .spec.ts)
```

Reference module: `modules/catalog`.

## Admin / client / common split

- When a resource has both admin and storefront endpoints, split controllers, services and repositories into `admin/` and `client/`.
- Client classes get a `-client` suffix: `ProductsClientController`, `ProductsClientService`, `ProductClientRepository`.
- Shared query logic goes into an **abstract** base in `common/` that both extend (e.g. `ProductQueryRepository`, `OrderQueryRepository`).

## Modules and DI

- Register every controller, service, repository (and the guards it uses) in the feature module's `providers`.
- Register entities with `TypeOrmModule.forFeature([...])` in the owning module.
- Export only what another module needs (e.g. `CatalogModule` exports `FavoriteProductRepository`). Import the module, not individual providers.
- Constructor injection with `private readonly`. Never `new` an injectable.
- Optional infra (BullMQ queue, Redis client) is injected with `@Optional()` and a `null` default; code must work when it is absent.

## Cross-cutting patterns

- **Pagination**: query DTO has `page`/`limit` → service calls `resolvePagination(query)` → repository returns `PaginatedResult<T>` (`{ items, total }`) → service returns `toListResponse(items, total, page, limit)`.
- **Simple results**: deletions and actions return `MessageResponse` (`{ message: <CONSTANT> }`).
- **Caching**: storefront reads go through `CacheService.wrap(descriptor, load)`; admin writes call `CacheService.invalidate(shopId)`. Redis failures must degrade to Postgres, never fail the request.
- **Async work**: emails go through BullMQ (`core/queue` + `processors/`) when enabled, with an inline fallback when not. Never do heavy work in request handlers.
- **Config**: `ConfigService` in new code. Existing `process.env` reads in some services/helpers are tech debt; don't copy them.
- **Errors**: throw Nest built-in exceptions; map Postgres errors with `matchesQueryFailedError` + `POSTGRES_ERROR_CODES` (see `database.md`).
