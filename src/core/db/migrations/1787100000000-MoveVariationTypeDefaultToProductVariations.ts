import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveVariationTypeDefaultToProductVariations1787100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE product_variations
      ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;

      UPDATE product_variations pv
      SET is_default = computed.is_default
      FROM (
        SELECT
          vvt.variation_id,
          COALESCE(BOOL_OR(vt.is_default), FALSE) AS is_default
        FROM variation_variation_types vvt
        JOIN variation_types vt ON vt.id = vvt.variation_type_id
        GROUP BY vvt.variation_id
      ) AS computed
      WHERE computed.variation_id = pv.id;

      ALTER TABLE variation_types
      DROP COLUMN is_default;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE variation_types
      ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;

      UPDATE variation_types vt
      SET is_default = computed.is_default
      FROM (
        SELECT
          vvt.variation_type_id,
          COALESCE(BOOL_OR(pv.is_default), FALSE) AS is_default
        FROM variation_variation_types vvt
        JOIN product_variations pv ON pv.id = vvt.variation_id
        GROUP BY vvt.variation_type_id
      ) AS computed
      WHERE computed.variation_type_id = vt.id;

      ALTER TABLE product_variations
      DROP COLUMN is_default;
    `);
  }
}
