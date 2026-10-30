import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Client sign-in never wrote to users_shops, so existing clients are bound to
 * the shops they have ordered from. New sign-ins bind themselves.
 */
export class BackfillUsersShopsFromOrders1789300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO users_shops (user_id, shop_id)
      SELECT DISTINCT o.user_id, o.shop_id
      FROM orders o
      JOIN users u ON u.id = o.user_id
      JOIN roles r ON r.id = u.role_id AND r.name = 'user'
      WHERE o.user_id IS NOT NULL
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(): Promise<void> {
    // Backfilled rows cannot be told apart from sign-in bindings.
  }
}
