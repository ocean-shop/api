import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVariationTypesTable1787000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE variation_type_name AS ENUM ('Color', 'Custom');

      CREATE TABLE variation_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name variation_type_name NOT NULL,
        value VARCHAR(255) NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX uq_variation_types_name_value
        ON variation_types(name, value);

      INSERT INTO variation_types (name, value, is_default)
      SELECT DISTINCT
        CASE
          WHEN LOWER(TRIM(at.name)) = 'color' THEN 'Color'::variation_type_name
          ELSE 'Custom'::variation_type_name
        END AS name,
        COALESCE(at.value, '') AS value,
        FALSE AS is_default
      FROM variation_attributes va
      JOIN attribute_types at ON at.id = va.attribute_type_id;

      CREATE TABLE variation_variation_types (
        variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
        variation_type_id UUID NOT NULL REFERENCES variation_types(id) ON DELETE CASCADE,
        PRIMARY KEY(variation_id, variation_type_id)
      );

      CREATE INDEX idx_variation_variation_types_variation_type_id
        ON variation_variation_types(variation_type_id);

      INSERT INTO variation_variation_types (variation_id, variation_type_id)
      SELECT
        va.variation_id,
        vt.id
      FROM variation_attributes va
      JOIN attribute_types at ON at.id = va.attribute_type_id
      JOIN variation_types vt
        ON vt.name = CASE
          WHEN LOWER(TRIM(at.name)) = 'color' THEN 'Color'::variation_type_name
          ELSE 'Custom'::variation_type_name
        END
        AND vt.value = COALESCE(at.value, '');

      DROP INDEX IF EXISTS idx_variation_attributes_attribute_type_id;
      DROP TABLE IF EXISTS variation_attributes;

      CREATE TRIGGER set_timestamp_variation_types
      BEFORE UPDATE ON variation_types
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE variation_attributes (
        variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
        attribute_type_id UUID NOT NULL REFERENCES attribute_types(id) ON DELETE CASCADE,
        PRIMARY KEY(variation_id, attribute_type_id)
      );

      CREATE INDEX idx_variation_attributes_attribute_type_id
        ON variation_attributes(attribute_type_id);

      INSERT INTO variation_attributes (variation_id, attribute_type_id)
      SELECT DISTINCT
        vvt.variation_id,
        at.id
      FROM variation_variation_types vvt
      JOIN variation_types vt ON vt.id = vvt.variation_type_id
      JOIN product_variations pv ON pv.id = vvt.variation_id
      JOIN products p ON p.id = pv.product_id
      JOIN attribute_types at
        ON at.shop_id = p.shop_id
        AND COALESCE(at.value, '') = vt.value
        AND (
          (vt.name = 'Color'::variation_type_name AND LOWER(TRIM(at.name)) = 'color')
          OR (vt.name = 'Custom'::variation_type_name AND LOWER(TRIM(at.name)) <> 'color')
        );

      DROP TRIGGER IF EXISTS set_timestamp_variation_types ON variation_types;
      DROP TABLE IF EXISTS variation_variation_types;
      DROP TABLE IF EXISTS variation_types;
      DROP TYPE IF EXISTS variation_type_name;
    `);
  }
}
