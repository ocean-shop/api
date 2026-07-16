import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorProductAttributes1783405000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
        ADD COLUMN sku VARCHAR(100),
        ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0,
        ADD COLUMN old_price DECIMAL(10,2),
        ADD CONSTRAINT products_price_non_negative_check CHECK (price >= 0),
        ADD CONSTRAINT products_old_price_non_negative_check CHECK (old_price IS NULL OR old_price >= 0),
        ADD CONSTRAINT products_old_price_gte_price_check CHECK (old_price IS NULL OR old_price >= price);

      ALTER TABLE attribute_types
        DROP COLUMN sort,
        ADD COLUMN value VARCHAR(255);

      DROP TABLE IF EXISTS variation_attribute_values;
      DROP TABLE IF EXISTS product_attributes;
      DROP TABLE IF EXISTS attribute_values;

      CREATE TABLE products_attributes (
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        attribute_type_id UUID NOT NULL REFERENCES attribute_types(id) ON DELETE CASCADE,
        PRIMARY KEY(product_id, attribute_type_id)
      );

      CREATE TABLE variation_attributes (
        variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
        attribute_type_id UUID NOT NULL REFERENCES attribute_types(id) ON DELETE CASCADE,
        PRIMARY KEY(variation_id, attribute_type_id)
      );

      CREATE INDEX idx_products_attributes_attribute_type_id
        ON products_attributes(attribute_type_id);
      CREATE INDEX idx_variation_attributes_attribute_type_id
        ON variation_attributes(attribute_type_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_variation_attributes_attribute_type_id;
      DROP INDEX IF EXISTS idx_products_attributes_attribute_type_id;

      DROP TABLE IF EXISTS variation_attributes;
      DROP TABLE IF EXISTS products_attributes;

      CREATE TABLE attribute_values (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attribute_type_id UUID NOT NULL REFERENCES attribute_types(id) ON DELETE CASCADE,
        value VARCHAR(255) NOT NULL,
        sort INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(attribute_type_id, value)
      );

      CREATE TABLE variation_attribute_values (
        variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
        attribute_value_id UUID NOT NULL REFERENCES attribute_values(id) ON DELETE CASCADE,
        PRIMARY KEY(variation_id, attribute_value_id)
      );

      CREATE TABLE product_attributes (
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        attribute_type_id UUID NOT NULL REFERENCES attribute_types(id) ON DELETE CASCADE,
        value VARCHAR(255),
        PRIMARY KEY(product_id, attribute_type_id)
      );

      CREATE INDEX idx_attribute_values_attribute_type_id
        ON attribute_values(attribute_type_id);
      CREATE INDEX idx_variation_attribute_values_attribute_value_id
        ON variation_attribute_values(attribute_value_id);
      CREATE INDEX idx_product_attributes_attribute_type_id
        ON product_attributes(attribute_type_id);

      CREATE TRIGGER set_timestamp_attribute_values
      BEFORE UPDATE ON attribute_values
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();

      ALTER TABLE attribute_types
        DROP COLUMN value,
        ADD COLUMN sort INT NOT NULL DEFAULT 0;

      ALTER TABLE products
        DROP CONSTRAINT IF EXISTS products_old_price_gte_price_check,
        DROP CONSTRAINT IF EXISTS products_old_price_non_negative_check,
        DROP CONSTRAINT IF EXISTS products_price_non_negative_check,
        DROP COLUMN old_price,
        DROP COLUMN price,
        DROP COLUMN sku;
    `);
  }
}
