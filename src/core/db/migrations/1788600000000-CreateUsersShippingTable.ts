import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersShippingTable1788600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users_shipping (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        method order_shipping_method NOT NULL,
        address VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_shipping_user_id ON users_shipping(user_id);

      CREATE TRIGGER set_timestamp_users_shipping
      BEFORE UPDATE ON users_shipping
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS set_timestamp_users_shipping ON users_shipping;
      DROP INDEX IF EXISTS idx_users_shipping_user_id;
      DROP TABLE IF EXISTS users_shipping;
    `);
  }
}
