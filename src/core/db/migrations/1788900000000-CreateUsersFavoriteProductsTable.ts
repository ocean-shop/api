import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersFavoriteProductsTable1788900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Target of the composite foreign key below, so a favorite can only point
      -- at a product of the shop it is stored under.
      ALTER TABLE products
        ADD CONSTRAINT uq_products_id_shop_id UNIQUE (id, shop_id);

      CREATE TABLE IF NOT EXISTS users_favorite_products (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
        product_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, product_id),
        CONSTRAINT fk_users_favorite_products_product
          FOREIGN KEY (product_id, shop_id)
          REFERENCES products(id, shop_id) ON DELETE CASCADE
      );

      -- Serves the per-shop listing of a user, newest favorite first.
      CREATE INDEX IF NOT EXISTS idx_users_favorite_products_user_shop_created
        ON users_favorite_products(user_id, shop_id, created_at DESC);

      -- Keeps the cascade on product deletion off a sequential scan.
      CREATE INDEX IF NOT EXISTS idx_users_favorite_products_product_id
        ON users_favorite_products(product_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_users_favorite_products_product_id;
      DROP INDEX IF EXISTS idx_users_favorite_products_user_shop_created;
      DROP TABLE IF EXISTS users_favorite_products;
      ALTER TABLE products DROP CONSTRAINT IF EXISTS uq_products_id_shop_id;
    `);
  }
}
