import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCatalogProductIndexes1788100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Catalog listing resolves a category to its product ids on every request;
      -- carrying product_id in the index keeps that step index-only.
      CREATE INDEX idx_products_categories_category_id_product_id
        ON products_categories(category_id, product_id);
      DROP INDEX IF EXISTS idx_products_categories_category_id;

      -- The catalog price (MIN of a product's variations) is a correlated
      -- subquery evaluated per row when filtering and sorting by price.
      CREATE INDEX idx_product_variations_product_id_price
        ON product_variations(product_id, price);

      -- Attribute filters match on (name, value), but the only index on
      -- attribute_types is the UNIQUE (shop_id, name, value) constraint, whose
      -- leading shop_id the filter never supplies.
      CREATE INDEX idx_attribute_types_name_value
        ON attribute_types(name, value);

      -- Default catalog ordering: newest first, id as the tie breaker.
      CREATE INDEX idx_products_active_created_at
        ON products(created_at DESC, id ASC)
        WHERE status = 'active';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_products_active_created_at;
      DROP INDEX IF EXISTS idx_attribute_types_name_value;
      DROP INDEX IF EXISTS idx_product_variations_product_id_price;

      CREATE INDEX IF NOT EXISTS idx_products_categories_category_id
        ON products_categories(category_id);
      DROP INDEX IF EXISTS idx_products_categories_category_id_product_id;
    `);
  }
}
