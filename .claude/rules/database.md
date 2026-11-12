---
paths:
  - "src/modules/**/entities/**/*.ts"
  - "src/modules/**/repositories/**/*.ts"
  - "src/core/db/**/*.ts"
---

# Database rules (TypeORM + PostgreSQL)

## Migrations

- Schema changes **only** via migrations in `src/core/db/migrations/`. `synchronize` is always `false`.
- Never edit a migration that is already merged/applied; add a new one.
- File: `<timestamp>-<PascalCaseName>.ts`; class: `<PascalCaseName><timestamp>` implementing `MigrationInterface`.
  Timestamp: take the latest one in the folder and add `100000000` (e.g. `1789300000000` → `1789400000000`).
- Write raw SQL with `queryRunner.query(...)`. Always implement `down()` as a real reversal; comment when Postgres can't reverse cleanly (e.g. enum values).
- Use `IF EXISTS` / `IF NOT EXISTS` where possible. Data backfills go in their own migration.
- Run locally with `npm run migration:run`, verify `npm run migration:revert` works, then run again. Prod runs `migration:run:prod` before deploy (`railway.json`).

## Entities

- Table names: snake_case plural (`@Entity('tags')`, `users_shops`). Columns: snake_case in DB, camelCase in TS via `name:`:
  `@Column({ type: 'uuid', name: 'shop_id' }) shopId: string;`
- PK: `@PrimaryGeneratedColumn('uuid') id: string`.
- Timestamps: `@CreateDateColumn` / `@UpdateDateColumn` with `type: 'timestamptz'`, `name: 'created_at' | 'updated_at'`.
- Always set an explicit `type` (`varchar` with `length`, `uuid`, `int`, `numeric`, `boolean`, `timestamptz`, Postgres enum).
- Relations: keep the FK column (`shopId`) **and** the relation (`shop`) with `@JoinColumn({ name: 'shop_id' })` and an explicit `onDelete`.
- Entity enums live in `entities/enums/<name>.enum.ts`.
- Every entity change needs a matching migration in the same PR.

## Repositories

- One `@Injectable()` repository class per aggregate, wrapping `@InjectRepository(Entity) private readonly repository: Repository<Entity>`. Only repositories import from `typeorm`'s `Repository`/`QueryBuilder`.
- `findById` throws `NotFoundException(<MESSAGES>.NOT_FOUND)`; `findBy*` lookups return `T | null` and let the service decide.
- Paginated reads return `PaginatedResult<T>` via `getManyAndCount()` with `.skip(skip).take(take)` and a deterministic `orderBy`.
- Filters: build a base query, then add `andWhere` per present filter with **named parameters**. Text search uses `ILIKE :x` with `%value%`.
- Never interpolate user input into SQL strings. Sort columns come from whitelist constants (`*-query.constants.ts`).
- Shared query logic between admin/client goes into an abstract `common/*-query.repository.ts`.
- Multi-statement writes that must be atomic use `this.repository.manager.transaction(async (manager) => { ... })`. Use `pg_advisory_xact_lock` for sequence-like values (see `order-client.repository.ts`).
- Select only needed relations; for paginated lists with joins, page by ids first then load relations (see `ProductQueryRepository`) to avoid duplicate rows breaking `skip/take`.

## Constraint errors

- Let the DB enforce uniqueness, and map violations in the **service**:
  ```ts
  matchesQueryFailedError(error, {
    code: POSTGRES_ERROR_CODES.UNIQUE_VIOLATION,
    constraintIn: TAG_DUPLICATE_NAME_CONSTRAINTS,
  })
  ```
- Constraint names live in `constants/<name>-constraint.constants.ts`. Rethrow unknown errors unchanged.
