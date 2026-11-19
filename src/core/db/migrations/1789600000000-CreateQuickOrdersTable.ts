import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuickOrdersTable1789600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE quick_order_status AS ENUM ('new', 'processed', 'cancelled');

      -- "Buy in one click": a lead with only a name and a phone for one product.
      -- The composite foreign key targets uq_products_id_shop_id, so the
      -- product is guaranteed to belong to the order's shop.
      CREATE TABLE IF NOT EXISTS quick_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
        product_id UUID NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        status quick_order_status NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_quick_orders_product
          FOREIGN KEY (product_id, shop_id)
          REFERENCES products(id, shop_id) ON DELETE CASCADE
      );

      -- Serves the admin list of a shop, newest first.
      CREATE INDEX IF NOT EXISTS idx_quick_orders_shop_created
        ON quick_orders(shop_id, created_at DESC);

      -- Keeps the cascade on product deletion off a sequential scan.
      CREATE INDEX IF NOT EXISTS idx_quick_orders_product_id
        ON quick_orders(product_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_quick_orders_product_id;
      DROP INDEX IF EXISTS idx_quick_orders_shop_created;
      DROP TABLE IF EXISTS quick_orders;
      DROP TYPE IF EXISTS quick_order_status;
    `);
  }
}
