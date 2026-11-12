---
paths:
  - "src/modules/**/controllers/**/*.ts"
  - "src/modules/**/dto/**/*.ts"
  - "src/modules/**/guards/**/*.ts"
  - "src/modules/**/decorators/**/*.ts"
---

# API / endpoint rules

## Routes

- Base path: `<module>/<resource>` in kebab-case plural: `catalog/tags`, `catalog/products`, `user/admins`, `settings/cache`.
- Client (storefront) controllers: `catalog/products-client`, `catalog/favorites-client`, or `user/client/<resource>` in the user module. Follow the neighbors in the module you are editing.
- REST verbs:

| Action | Verb + path | Service method |
| --- | --- | --- |
| List (paginated) | `GET /` + query DTO | `list<Resources>(query)` |
| Get one | `GET /:id` | `get<Resource>ById(id)` |
| Create | `POST /` | `create<Resource>(dto)` |
| Partial update | `PATCH /:id` | `update<Resource>(id, dto)` |
| Delete | `DELETE /:id` | `remove<Resource>(id)` |
| Sub-action | `PATCH /:id/<action>` / `POST /:id/<relation>` | descriptive name |

- Controller methods are one-liners: `return this.xService.method(...)`.

## Controller template

```ts
@Controller('catalog/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Catalog Tags')
@ApiBearerAuth('access-token')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Update tag' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateTagDto })
  async updateTag(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.updateTag(id, dto);
  }
}
```

- Auth: guards at class level for fully protected controllers; per-method `@UseGuards` when some routes are public (e.g. `POST /orders-client`). Always pair `@ApiBearerAuth('access-token')` with guarded routes.
- Roles: `@Roles(...ADMIN_ROLES)` for admin, `@Roles(...ALL_ROLES)` for logged-in clients.
- Current user: `@Req() request: AuthenticatedRequest` → pass `request.user` to the service (import with `import type`).
- Swagger on every route: `@ApiOperation({ summary })`, `@ApiParam` for params, `@ApiQuery` for query fields, `@ApiBody({ type: Dto })` for bodies.

## DTOs

- File: `dto/<resource>/<action>-<resource>.dto.ts` (`create-tag.dto.ts`, `list-tags-query.dto.ts`).
- All fields `readonly`, validated with `class-validator`, documented with `@ApiProperty` / `@ApiPropertyOptional`.
- Optional fields: `@IsOptional()` first, type `?`.
- Query DTOs: numbers need `@Type(() => Number)`; pagination fields are `page = 1` (`@Min(1)`) and `limit = 20` (`@Min(1) @Max(100)`).
- Update DTOs: a separate class with every field optional (`@IsOptional()`); immutable fields like `shopId` are left out.
- Reuse regexes/messages from `constants/` (e.g. `UKRAINIAN_PHONE_REGEX`).

## Responses

- Entity / entity array for single reads and writes.
- Lists: `ListResponse<T>` = `{ items, total, page, limit, totalPages }` built by `toListResponse`.
- Deletes and actions: `MessageResponse` = `{ message }` with a constant from `*-messages.constants.ts`.

## Errors

- Throw Nest exceptions with a message constant: `throw new NotFoundException(TAG_MESSAGES.NOT_FOUND)`. Messages are Ukrainian, user-facing.
- Error body is Nest's default `{ statusCode, message, error }`; don't build custom error objects.
- `NotFoundException` missing resource · `BadRequestException` invalid input / duplicate · `ConflictException` state conflicts · `ForbiddenException` not owner / wrong role · `UnauthorizedException` bad or missing token.

## When adding an endpoint

1. DTO(s) in `dto/<resource>/` → 2. repository method (+ spec) → 3. service method (+ spec) → 4. controller route (+ spec) → 5. register providers in the module → 6. invalidate the cache on admin writes that affect the storefront → 7. run CI checks.
