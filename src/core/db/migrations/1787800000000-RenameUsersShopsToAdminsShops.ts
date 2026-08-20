import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUsersShopsToAdminsShops1787800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS users_shops RENAME TO admins_shops;
      ALTER INDEX IF EXISTS idx_users_shops_shop_id RENAME TO idx_admins_shops_shop_id;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS admins_shops RENAME TO users_shops;
      ALTER INDEX IF EXISTS idx_admins_shops_shop_id RENAME TO idx_users_shops_shop_id;
    `);
  }
}
