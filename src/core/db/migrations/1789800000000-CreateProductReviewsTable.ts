import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductReviewsTable1789800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE product_review_status AS ENUM ('pending', 'approved', 'rejected');

      -- Customer review of a product. The composite foreign key targets
      -- uq_products_id_shop_id, so the product is guaranteed to belong to the
      -- review's shop. The author is kept nullable: a review outlives the
      -- deletion of the user account.
      CREATE TABLE IF NOT EXISTS product_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
        product_id UUID NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        advantages VARCHAR(2000),
        drawbacks VARCHAR(2000),
        comment VARCHAR(5000) NOT NULL,
        rating SMALLINT NOT NULL,
        status product_review_status NOT NULL DEFAULT 'pending',
        approved_purchase BOOLEAN NOT NULL DEFAULT FALSE,
        is_useful INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_product_reviews_rating CHECK (rating BETWEEN 1 AND 5),
        CONSTRAINT chk_product_reviews_is_useful CHECK (is_useful >= 0),
        CONSTRAINT fk_product_reviews_product
          FOREIGN KEY (product_id, shop_id)
          REFERENCES products(id, shop_id) ON DELETE CASCADE
      );

      -- Serves the storefront list of approved reviews of a product, newest first.
      CREATE INDEX IF NOT EXISTS idx_product_reviews_product_status_created
        ON product_reviews(product_id, status, created_at DESC);

      -- Serves the admin list of a shop, newest first.
      CREATE INDEX IF NOT EXISTS idx_product_reviews_shop_created
        ON product_reviews(shop_id, created_at DESC);

      -- Keeps the SET NULL on user deletion off a sequential scan.
      CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id
        ON product_reviews(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_product_reviews_user_id;
      DROP INDEX IF EXISTS idx_product_reviews_shop_created;
      DROP INDEX IF EXISTS idx_product_reviews_product_status_created;
      DROP TABLE IF EXISTS product_reviews;
      DROP TYPE IF EXISTS product_review_status;
    `);
  }
}
