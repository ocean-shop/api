---
name: add-endpoint
description: Add a new REST endpoint (or a full CRUD resource) to the Ocean Shop API end to end — DTO, repository, service, controller, specs, module wiring, cache invalidation and CI checks. Use when asked to add/create/expose an endpoint, route, API, or admin/client (storefront) action in src/modules.
---

# Add an endpoint

Walk the layers bottom-up so each layer compiles against the one below. Conventions live in the rules — read them first instead of guessing:

- `.claude/rules/api.md` — routes, verbs, controller/DTO templates, responses, errors
- `.claude/rules/architecture.md` — layers, folder layout, admin/client/common split
- `.claude/rules/database.md` — repository patterns (pagination, filters, transactions)
- `.claude/rules/testing.md` — spec structure and mocking per layer
- `.claude/rules/code-style.md` — naming, types, constants

## 0. Decide before writing code

Answer these (ask the user only if the request truly doesn't say):

1. **Audience**: admin (`ADMIN_ROLES`), logged-in client (`ALL_ROLES`), or public? → decides `admin/` vs `client/` folder, `-client` suffix, guards.
2. **Existing resource or new one?** Extend the existing controller/service/repository if the resource exists. Search first: `src/modules/<module>/controllers/<resource>/`.
3. **Shape**: list (paginated) / get one / create / update / delete / sub-action → method + path + service name from the table in `api.md`.
4. **Ownership**: does a client route touch a user's own data? → service must call `assertCanAccessUser(userId, request.user)` from `user/helpers/access`.
5. **Cache**: does an admin write change what the storefront reads? → `cacheService.invalidate(shopId)`. Is it a hot storefront read? → `cacheService.wrap(...)`.
6. **Schema change needed?** If yes, run the `add-migration` skill first.

## 1. Constants

Add to the module's `constants/`:
- messages → `<resource>-messages.constants.ts` (Ukrainian, user-facing: `NOT_FOUND`, `REMOVED`, `DUPLICATE_*`…)
- unique-constraint names → `<resource>-constraint.constants.ts` (if mapping DB errors)
- limits / defaults / sort whitelists → `<resource>.constants.ts` / `*-query.constants.ts`

## 2. DTOs + models

- `dto/<resource>/<action>-<resource>.dto.ts`, all fields `readonly`, `class-validator` + `@ApiProperty`.
- Bound everything: `@MaxLength`, `@Min/@Max`, `@ArrayMaxSize`, `@ValidateNested() @Type()` for nested.
- Query DTO numbers need `@Type(() => Number)`; pagination `page = 1`, `limit = 20` (max 100).
- Reused types (`<Resource>Filters`, `<Resource>ListResponse`) → `models/<resource>.models.ts`, `type` only.

## 3. Repository (+ spec)

`repositories/<resource>/[admin|client|common]/<resource>.repository.ts`
- Only layer that imports `Repository` / `QueryBuilder` from `typeorm`.
- Named parameters only; sort columns from a whitelist constant.
- Joins + pagination → page by ids first (see `ProductQueryRepository`).

## 4. Service (+ spec)

`services/<resource>/[admin|client|common]/<resource>.service.ts`
- Business rules, `ensure*` / `is*` private helpers, map `QueryFailedError` via `matchesQueryFailedError` + `POSTGRES_ERROR_CODES`, rethrow unknown errors.
- Lists: `resolvePagination(query)` → repo `findAllPaginated` → `toListResponse(...)`.
- Deletes/actions return `MessageResponse` with a message constant.
- Explicit return types. `ConfigService`, never `process.env`.

## 5. Controller (+ spec)

`controllers/<resource>/[admin|client]/<resource>.controller.ts`
- One-liner methods delegating to the service.
- `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` + `@ApiBearerAuth('access-token')` on protected routes.
- `ParseUUIDPipe` on every UUID param. Full Swagger: `@ApiOperation`, `@ApiParam`, `@ApiQuery`, `@ApiBody`.
- Current user: `@Req() request: AuthenticatedRequest` (`import type`) → pass `request.user` to the service.

## 6. Wire the module

In `<module>.module.ts`: add controller to `controllers`, service + repository to `providers`, new entity to `TypeOrmModule.forFeature([...])`. Export only if another module needs it.

## 7. Tests

Every new/changed repository, service, controller, helper gets specs next to it. Cover happy path, each filter/branch, every thrown exception; assert both result and mock calls. Run the folder first: `npx jest src/modules/<module>/<layer>/<resource>`.

## 8. Verify (CI order — all must pass)

```bash
npm run build
npm run format:check   # on failure: npm run format:write
npm run lint:check     # on failure: npm run lint, then fix the rest by hand
npm run test:cov       # coverage gate ≥ 70%
```

Do **not** commit — report what was added (routes, files, any migration) and let the user decide.

## Reference implementations (copy patterns from these, not from memory)

| Need | File |
| --- | --- |
| Admin CRUD controller | `src/modules/catalog/controllers/tags/tags.controller.ts` (+ `.spec.ts` shows guard overrides) |
| Service with uniqueness + DB error mapping | `src/modules/catalog/services/tags/tags.service.ts` (+ `.spec.ts`) |
| Repository with paginated filters | `src/modules/catalog/repositories/tag/tag.repository.ts` (+ `.spec.ts` shows query-builder mock) |
| DTOs (create / update / list query) | `src/modules/catalog/dto/tags/` |
| Client controller using `request.user` | `src/modules/user/controllers/users/client/shippng-client/shipping-client.controller.ts` |
| Ownership check in service | `src/modules/user/services/shipping/shipping.service.ts` (`assertCanAccessUser`) |
| Cache invalidate on admin write | `src/modules/catalog/services/attributes/attributes.service.ts` |
| Cached storefront read (`wrap`) | `src/modules/catalog/services/products/client/products-client.service.ts` |
| Admin/client split with shared abstract query repo | `src/modules/catalog/repositories/product/{admin,client,common}/` |

## Checklist before reporting done

- [ ] No layer skipped (controller → service → repository)
- [ ] No inline strings/numbers — messages, limits, constraint names in `constants/`
- [ ] Every input through a bounded DTO; UUID params use `ParseUUIDPipe`
- [ ] Guards + roles + Swagger on every route; ownership checked for client user data
- [ ] Cache invalidated on admin writes affecting the storefront
- [ ] Providers/controllers registered in the module
- [ ] Specs added; all four CI steps pass
