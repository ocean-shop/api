import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersShopsTable1787900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users_shops (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
        PRIMARY KEY(user_id, shop_id)
      );

      CREATE INDEX IF NOT EXISTS idx_users_shops_shop_id ON users_shops(shop_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_users_shops_shop_id;
      DROP TABLE IF EXISTS users_shops;
    `);
  }
}
