---
paths:
  - "src/**/*.ts"
---

# Code style rules

Enforced by Prettier (`singleQuote: true`, `trailingComma: 'all'`, 2 spaces, 80 cols) and ESLint (`typescript-eslint` recommendedTypeChecked + prettier). Run `npm run format:write` and `npm run lint` instead of hand-formatting.

## Naming

| Thing | Convention | Example |
| --- | --- | --- |
| Files | kebab-case + type suffix | `product-query.constants.ts`, `slug.helpers.ts`, `create-tag.dto.ts` |
| Classes | PascalCase + type suffix | `TagsService`, `TagRepository`, `CreateTagDto`, `JwtAuthGuard` |
| Services / controllers | plural resource | `TagsService`, `TagsController` |
| Repositories / entities | singular resource | `TagRepository`, `Tag` |
| Client variants | `-client` / `Client` | `products-client.service.ts` → `ProductsClientService` |
| DTOs | `<Action><Resource>Dto` | `CreateTagDto`, `UpdateTagDto`, `ListTagsQueryDto` |
| Types | PascalCase | `TagFilters`, `TagListResponse` |
| Constants | UPPER_SNAKE_CASE; grouped in `as const` objects | `TAG_MESSAGES.NOT_FOUND`, `ADMIN_ROLES` |
| Functions / methods / vars | camelCase, verb-first | `listTags`, `findByShopIdAndName`, `ensureNameUniqueInShop` |
| Private guard methods | `ensure*` (throws) / `is*` (boolean) | `ensureNameUniqueInShop`, `isDuplicateNameError` |

Service method names: `list*`, `get*ById`, `create*`, `update*`, `remove*`.
Repository method names: `findAllPaginated`, `findById` (throws), `findBy*` (returns `T | null`), `create`, `save`, `remove`.

## Imports

- Relative imports only (no path aliases). Order: framework/libs (`@nestjs/*`, `typeorm`, `class-validator`) first, then project imports.
- Use `import type { X }` when a type is only used in a decorated signature (e.g. `AuthenticatedRequest`), required by `isolatedModules` + `emitDecoratorMetadata`.
- Import from the defining file; there are no barrel `index.ts` files.

## Types

- `type` aliases, **never `interface`**.
- No new TS `enum`s for non-entity values: use `as const` + derived union, e.g. `type SortOrder = (typeof SORT_ORDERS)[number]`. Existing `entities/enums/*.enum.ts` stay.
- Reuse with `Pick`, `Omit`, `Partial`, `Readonly`, generics (`PaginatedResult<T>`, `ListResponse<T>`).
- Reused types go in `models/<name>.models.ts`, not inline in services/controllers.
- No `any` in production code; use `unknown` and narrow (e.g. `catch (error)` → `matchesQueryFailedError(error, ...)`).
- Explicit return types on all public service, repository and helper functions.

## Preferred patterns

- Small, single-purpose methods; extract private helpers (`ensure*`, `save*`, `is*`).
- Early returns instead of nested `if/else`.
- `async/await`, never `.then()` chains.
- Conditional object spread for optional filters: `...(query.name ? { name: query.name } : {})`.
- Pure logic → exported functions in `helpers/` (unit-testable without Nest).
- Constants in `constants/`: messages (`*-messages.constants.ts`), DB constraint names (`*-constraint.constants.ts`), limits, defaults, tokens.
- Short `/** ... */` doc comments on constants and non-obvious methods explaining **why**, not what.
- Logging via `new Logger(ClassName.name)` as a `private readonly logger` field.

## Avoid

- `interface`, new `enum`, `any`, raw promise chains.
- Magic strings/numbers inline (messages, limits, constraint names, job names).
- `process.env` in services (use `ConfigService`).
- `console.log` (use Nest `Logger`).
- Business logic in controllers; TypeORM in services.
- Flat files directly in `services/`, `controllers/`, `helpers/`, etc. (each gets its own folder).
- Commented-out code and unused imports.
