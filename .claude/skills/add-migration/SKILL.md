---
name: add-migration
description: Change the Ocean Shop database schema safely — update the TypeORM entity and write a new raw-SQL migration in src/core/db/migrations with a correct timestamp, a real down(), and a run → revert → run check. Use when adding/removing/renaming a column, table, index, constraint or Postgres enum value, or backfilling data.
---

# Add a migration

Full conventions: `.claude/rules/database.md`. `synchronize` is always `false` — the migration is the only way the schema changes.

## 1. Pick the timestamp and name

List `src/core/db/migrations/` and take the **highest** timestamp, then add `100000000`:

```
1789300000000-BackfillUsersShopsFromOrders.ts  →  next: 1789400000000
```

- Make sure the new timestamp is unique (two existing files share `1788100000000`; don't add more collisions).
- File: `<timestamp>-<PascalCaseName>.ts`, e.g. `1789400000000-AddProductWeight.ts`
- Class: `<PascalCaseName><timestamp>`, e.g. `AddProductWeight1789400000000`
- Name describes the change with a verb: `Add…`, `Create…Table`, `Rename…`, `Make…Nullable`, `Backfill…`.

**Never edit an existing migration** — even to fix it. Add a new one.

## 2. Write the migration

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductWeight1789400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS weight_grams INT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN IF EXISTS weight_grams;
    `);
  }
}
```

Rules:
- Raw SQL via `queryRunner.query(...)`; values via `$1` placeholders, never string interpolation.
- snake_case table/column names; tables are plural.
- `IF EXISTS` / `IF NOT EXISTS` wherever Postgres supports it.
- `down()` reverses `up()` in **reverse order** (drop index before column, etc.).
- New `NOT NULL` column on a table with rows → add nullable (or with `DEFAULT`), backfill, then `SET NOT NULL`.
- Name constraints/indexes explicitly (`uq_<table>_<cols>`, `idx_<table>_<cols>`, `fk_...`) and put unique-constraint names the service maps into `constants/<name>-constraint.constants.ts`.
- **Data backfills go in their own migration** (see `1789300000000-BackfillUsersShopsFromOrders.ts`), unless needed mid-way to make a constraint valid (see `1789100000000-AddSeoFields.ts`).
- **Postgres enum values can't be dropped**: `up` uses `ALTER TYPE … ADD VALUE IF NOT EXISTS`; `down` recreates the type and comments the risk. Copy `1789200000000-AddManualOrderPaymentMethod.ts`.

## 3. Update the entity

In `src/modules/<module>/entities/<name>.entity.ts` (see `database.md` → Entities):
- explicit `type`, snake_case `name:`, camelCase property: `@Column({ type: 'int', name: 'weight_grams', nullable: true }) weightGrams: number | null;`
- relations keep the FK column **and** the relation with `@JoinColumn({ name: '…_id' })` + explicit `onDelete`
- new enums in `entities/enums/<name>.enum.ts`
- new entity → register in the owning module's `TypeOrmModule.forFeature([...])`

The entity and the SQL must match exactly (type, length, nullability, default) — TypeORM won't catch drift.

## 4. Propagate

Update anything that reads/writes the field: DTOs (bounded validators), models, repository selects/filters, service mapping, seeders in `src/core/db/seeders/` if base data changes, and their specs. If an endpoint is also needed, continue with the `add-endpoint` skill.

## 5. Verify against the database

Migrations run against `DATABASE_URL` from `.env`. **Before running anything, confirm with the user that it points to a local/dev database** — never run these against production. Don't print `.env`.

```bash
npm run migration:run      # applies
npm run migration:revert   # proves down() works
npm run migration:run      # applies again cleanly
```

If no database is available, say so explicitly in the report — don't claim the migration was verified.

## 6. CI checks

```bash
npm run build && npm run format:check && npm run lint:check && npm run test:cov
```

Do **not** commit. In the report, list the new migration file and note it must be mentioned in the PR description (prod runs `migration:run:prod` before deploy via `railway.json`).

## Checklist

- [ ] New file, unique timestamp = latest + `100000000`, class name = `<Name><timestamp>`
- [ ] No existing migration edited
- [ ] `down()` is a real reversal (or commented why it can't be)
- [ ] Entity matches the SQL exactly
- [ ] Constraint names in constants if mapped in a service
- [ ] run → revert → run done on a local DB (or explicitly reported as not done)
- [ ] CI steps pass
