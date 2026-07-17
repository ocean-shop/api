import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueProductSkuPerShop1785000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_products_shop_sku
        ON products (shop_id, sku)
        WHERE sku IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS uq_products_shop_sku;
    `);
  }
}
