import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidateVariationAttributes1787400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS set_timestamp_variation_attribute_values ON variation_attribute_values;
      DROP TABLE IF EXISTS variation_attribute_values;

      DROP TRIGGER IF EXISTS set_timestamp_variation_attribute_types ON variation_attribute_types;
      DROP INDEX IF EXISTS uq_variation_attribute_types_name;
      DROP TABLE IF EXISTS variation_attribute_types;

      CREATE TABLE IF NOT EXISTS variation_attributes (
        variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (variation_id, name, value)
      );

      CREATE INDEX IF NOT EXISTS idx_variation_attributes_name
        ON variation_attributes(name);

      DROP TRIGGER IF EXISTS set_timestamp_variation_attributes ON variation_attributes;
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

      CREATE TABLE variation_attribute_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX uq_variation_attribute_types_name
        ON variation_attribute_types(name);

      CREATE TABLE variation_attribute_values (
        variation_attribute_types_id UUID NOT NULL REFERENCES variation_attribute_types(id) ON DELETE CASCADE,
        product_variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
        value VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (variation_attribute_types_id, product_variation_id, value)
      );

      CREATE INDEX idx_variation_attribute_values_product_variation_id
        ON variation_attribute_values(product_variation_id);

      CREATE TRIGGER set_timestamp_variation_attribute_types
      BEFORE UPDATE ON variation_attribute_types
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();

      CREATE TRIGGER set_timestamp_variation_attribute_values
      BEFORE UPDATE ON variation_attribute_values
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);
  }
}
