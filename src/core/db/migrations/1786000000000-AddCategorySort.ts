import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategorySort1786000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE categories
        ADD COLUMN sort INT NOT NULL DEFAULT 0;
    `);

    await queryRunner.query(`
      WITH ranked AS (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY shop_id, parent_id
            ORDER BY created_at ASC, id ASC
          ) - 1 AS sort_value
        FROM categories
      )
      UPDATE categories c
      SET sort = ranked.sort_value
      FROM ranked
      WHERE c.id = ranked.id;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE categories
        DROP COLUMN sort;
    `);
  }
}
