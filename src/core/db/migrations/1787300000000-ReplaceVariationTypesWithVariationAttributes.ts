import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceVariationTypesWithVariationAttributes1787300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS variation_variation_types;

      DROP TRIGGER IF EXISTS set_timestamp_variation_types ON variation_types;
      DROP TABLE IF EXISTS variation_types;
      DROP TYPE IF EXISTS variation_type_name;

      ALTER TABLE product_variations
      ADD COLUMN title VARCHAR(255);

      DROP TRIGGER IF EXISTS set_timestamp_variation_attribute_values ON variation_attribute_values;
      DROP TABLE IF EXISTS variation_attribute_values;
      DROP TRIGGER IF EXISTS set_timestamp_variation_attribute_types ON variation_attribute_types;
      DROP INDEX IF EXISTS uq_variation_attribute_types_name;
      DROP TABLE IF EXISTS variation_attribute_types;

      CREATE TABLE variation_attributes (
        variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (variation_id, name, value)
      );

      CREATE INDEX idx_variation_attributes_name
        ON variation_attributes(name);

      CREATE TRIGGER set_timestamp_variation_attributes
      BEFORE UPDATE ON variation_attributes
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS set_timestamp_variation_attributes ON variation_attributes;
      DROP INDEX IF EXISTS idx_variation_attributes_name;
      DROP TABLE IF EXISTS variation_attributes;

      ALTER TABLE product_variations
      DROP COLUMN IF EXISTS title;

      CREATE TYPE variation_type_name AS ENUM ('Color', 'Custom');

      CREATE TABLE variation_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name variation_type_name NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX uq_variation_types_name
        ON variation_types(name);

      CREATE TABLE variation_variation_types (
        variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
        variation_type_id UUID NOT NULL REFERENCES variation_types(id) ON DELETE CASCADE,
        value VARCHAR(255) NOT NULL,
        PRIMARY KEY (variation_id, variation_type_id, value)
      );

      CREATE INDEX idx_variation_variation_types_variation_type_id
        ON variation_variation_types(variation_type_id);

      CREATE TRIGGER set_timestamp_variation_types
      BEFORE UPDATE ON variation_types
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);
  }
}
