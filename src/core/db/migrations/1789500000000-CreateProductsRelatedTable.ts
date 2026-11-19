import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsRelatedTable1789500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- One-way link "product -> related product" (e.g. a case -> a screen
      -- protector). Both composite foreign keys target uq_products_id_shop_id,
      -- so the two products are guaranteed to belong to the same shop.
      CREATE TABLE IF NOT EXISTS products_related (
        product_id UUID NOT NULL,
        related_product_id UUID NOT NULL,
        shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (product_id, related_product_id),
        CONSTRAINT chk_products_related_not_self
          CHECK (product_id <> related_product_id),
        CONSTRAINT fk_products_related_product
          FOREIGN KEY (product_id, shop_id)
          REFERENCES products(id, shop_id) ON DELETE CASCADE,
        CONSTRAINT fk_products_related_related_product
          FOREIGN KEY (related_product_id, shop_id)
          REFERENCES products(id, shop_id) ON DELETE CASCADE
      );

      -- Serves the ordered related list of a product.
      CREATE INDEX IF NOT EXISTS idx_products_related_product_sort
        ON products_related(product_id, sort_order);

      -- Keeps the cascade on deletion of a related product off a sequential scan.
      CREATE INDEX IF NOT EXISTS idx_products_related_related_product_id
        ON products_related(related_product_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_products_related_related_product_id;
      DROP INDEX IF EXISTS idx_products_related_product_sort;
      DROP TABLE IF EXISTS products_related;
    `);
  }
}
