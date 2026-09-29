import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductNameSearchIndex1788200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Storefront search matches names with ILIKE '%term%', which no btree index
    // can serve. Trigrams turn that scan into an index lookup.
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
      EXCEPTION
        -- Search keeps answering without the extension, only through a
        -- sequential scan, so a database that forbids extensions must not block
        -- the deploy.
        WHEN insufficient_privilege THEN
          RAISE WARNING 'pg_trgm is unavailable: product search falls back to a sequential scan';
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
          CREATE INDEX IF NOT EXISTS idx_products_active_name_trgm
            ON products USING GIN (name gin_trgm_ops)
            WHERE status = 'active';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The extension stays: dropping it would take other objects with it if
    // anything started depending on it in the meantime.
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_products_active_name_trgm;
    `);
  }
}
