import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveVariationTypeValueToVariationVariationTypes1787200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE variation_variation_types
      ADD COLUMN value VARCHAR(255);

      UPDATE variation_variation_types vvt
      SET value = vt.value
      FROM variation_types vt
      WHERE vt.id = vvt.variation_type_id;

      ALTER TABLE variation_variation_types
      ALTER COLUMN value SET NOT NULL;

      ALTER TABLE variation_variation_types
      DROP CONSTRAINT IF EXISTS variation_variation_types_pkey;

      UPDATE variation_variation_types vvt
      SET variation_type_id = canonical.id
      FROM variation_types source_vt
      JOIN (
        SELECT DISTINCT ON (name) id, name
        FROM variation_types
        ORDER BY name, created_at ASC, id ASC
      ) canonical ON canonical.name = source_vt.name
      WHERE source_vt.id = vvt.variation_type_id
        AND vvt.variation_type_id <> canonical.id;

      DELETE FROM variation_variation_types vvt
      USING (
        SELECT
          ctid,
          ROW_NUMBER() OVER (
            PARTITION BY variation_id, variation_type_id, value
            ORDER BY ctid
          ) AS row_num
        FROM variation_variation_types
      ) duplicated
      WHERE vvt.ctid = duplicated.ctid
        AND duplicated.row_num > 1;

      ALTER TABLE variation_variation_types
      ADD CONSTRAINT variation_variation_types_pkey
      PRIMARY KEY (variation_id, variation_type_id, value);

      DELETE FROM variation_types vt
      USING (
        SELECT DISTINCT ON (name) id, name
        FROM variation_types
        ORDER BY name, created_at ASC, id ASC
      ) canonical
      WHERE vt.name = canonical.name
        AND vt.id <> canonical.id;

      DROP INDEX IF EXISTS uq_variation_types_name_value;

      ALTER TABLE variation_types
      DROP COLUMN value;

      CREATE UNIQUE INDEX uq_variation_types_name
        ON variation_types(name);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS uq_variation_types_name;

      ALTER TABLE variation_types
      ADD COLUMN value VARCHAR(255);

      UPDATE variation_types vt
      SET value = COALESCE(seed.seed_value, '')
      FROM (
        SELECT
          variation_type_id,
          MIN(value) AS seed_value
        FROM variation_variation_types
        GROUP BY variation_type_id
      ) seed
      WHERE seed.variation_type_id = vt.id;

      UPDATE variation_types
      SET value = ''
      WHERE value IS NULL;

      INSERT INTO variation_types (name, value)
      SELECT DISTINCT
        source_vt.name,
        vvt.value
      FROM variation_variation_types vvt
      JOIN variation_types source_vt ON source_vt.id = vvt.variation_type_id
      LEFT JOIN variation_types existing
        ON existing.name = source_vt.name
       AND existing.value = vvt.value
      WHERE existing.id IS NULL;

      UPDATE variation_variation_types vvt
      SET variation_type_id = target_vt.id
      FROM variation_types source_vt, variation_types target_vt
      WHERE source_vt.id = vvt.variation_type_id
        AND target_vt.name = source_vt.name
        AND target_vt.value = vvt.value
        AND target_vt.id <> vvt.variation_type_id;

      ALTER TABLE variation_types
      ALTER COLUMN value SET NOT NULL;

      CREATE UNIQUE INDEX uq_variation_types_name_value
        ON variation_types(name, value);

      ALTER TABLE variation_variation_types
      DROP CONSTRAINT IF EXISTS variation_variation_types_pkey;

      DELETE FROM variation_variation_types vvt
      USING (
        SELECT
          ctid,
          ROW_NUMBER() OVER (
            PARTITION BY variation_id, variation_type_id
            ORDER BY ctid
          ) AS row_num
        FROM variation_variation_types
      ) duplicated
      WHERE vvt.ctid = duplicated.ctid
        AND duplicated.row_num > 1;

      ALTER TABLE variation_variation_types
      DROP COLUMN value;

      ALTER TABLE variation_variation_types
      ADD CONSTRAINT variation_variation_types_pkey
      PRIMARY KEY (variation_id, variation_type_id);
    `);
  }
}
