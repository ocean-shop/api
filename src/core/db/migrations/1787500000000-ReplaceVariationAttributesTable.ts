import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceVariationAttributesTable1787500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS set_timestamp_variation_attributes ON variation_attributes;
      DROP INDEX IF EXISTS idx_variation_attributes_name;
      DROP TABLE IF EXISTS variation_attributes;

      CREATE TABLE variations_attributes (
        variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
        attribute_type_id UUID NOT NULL REFERENCES attribute_types(id) ON DELETE CASCADE,
        PRIMARY KEY (variation_id, attribute_type_id)
      );

      CREATE INDEX idx_variations_attributes_attribute_type_id
        ON variations_attributes(attribute_type_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_variations_attributes_attribute_type_id;
      DROP TABLE IF EXISTS variations_attributes;

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
}
