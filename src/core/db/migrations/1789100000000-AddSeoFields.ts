import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  slugify,
  withSlugSuffix,
} from '../../../modules/catalog/helpers/slug.helpers';

export class AddSeoFields1789100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN slug VARCHAR(255),
      ADD COLUMN meta_title VARCHAR(255),
      ADD COLUMN meta_description VARCHAR(500),
      ADD COLUMN canonical_url VARCHAR(500),
      ADD COLUMN no_index BOOLEAN NOT NULL DEFAULT false;
    `);

    await this.backfillProductSlugs(queryRunner);

    await queryRunner.query(`
      ALTER TABLE products
      ALTER COLUMN slug SET NOT NULL;

      CREATE UNIQUE INDEX uq_products_shop_slug
        ON products (shop_id, slug);
    `);

    await queryRunner.query(`
      ALTER TABLE categories
      ADD COLUMN meta_title VARCHAR(255),
      ADD COLUMN meta_description VARCHAR(500),
      ADD COLUMN canonical_url VARCHAR(500),
      ADD COLUMN no_index BOOLEAN NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      ALTER TABLE product_images
      ADD COLUMN alt VARCHAR(255);

      ALTER TABLE variation_images
      ADD COLUMN alt VARCHAR(255);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE variation_images
      DROP COLUMN IF EXISTS alt;

      ALTER TABLE product_images
      DROP COLUMN IF EXISTS alt;

      ALTER TABLE categories
      DROP COLUMN IF EXISTS no_index,
      DROP COLUMN IF EXISTS canonical_url,
      DROP COLUMN IF EXISTS meta_description,
      DROP COLUMN IF EXISTS meta_title;

      DROP INDEX IF EXISTS uq_products_shop_slug;

      ALTER TABLE products
      DROP COLUMN IF EXISTS no_index,
      DROP COLUMN IF EXISTS canonical_url,
      DROP COLUMN IF EXISTS meta_description,
      DROP COLUMN IF EXISTS meta_title,
      DROP COLUMN IF EXISTS slug;
    `);
  }

  /**
   * Derives a slug from every existing product name. The oldest product keeps
   * the bare slug and later namesakes in the same shop get `-2`, `-3`, … so the
   * unique index can be created right after.
   */
  private async backfillProductSlugs(queryRunner: QueryRunner): Promise<void> {
    const products = (await queryRunner.query(
      `SELECT id, shop_id, name FROM products ORDER BY created_at, id`,
    )) as Array<{ id: string; shop_id: string; name: string }>;

    const usedSlugsByShop = new Map<string, Set<string>>();

    for (const product of products) {
      const usedSlugs =
        usedSlugsByShop.get(product.shop_id) ?? new Set<string>();
      usedSlugsByShop.set(product.shop_id, usedSlugs);

      const base = slugify(product.name);
      let attempt = 1;
      let slug = withSlugSuffix(base, attempt);
      while (usedSlugs.has(slug)) {
        attempt += 1;
        slug = withSlugSuffix(base, attempt);
      }
      usedSlugs.add(slug);

      await queryRunner.query(`UPDATE products SET slug = $1 WHERE id = $2`, [
        slug,
        product.id,
      ]);
    }
  }
}
