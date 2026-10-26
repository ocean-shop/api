import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersShippingIsMain1788800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users_shipping
      ADD COLUMN IF NOT EXISTS is_main BOOLEAN NOT NULL DEFAULT FALSE;

      CREATE UNIQUE INDEX IF NOT EXISTS uq_users_shipping_user_id_is_main
      ON users_shipping(user_id)
      WHERE is_main;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS uq_users_shipping_user_id_is_main;

      ALTER TABLE users_shipping
      DROP COLUMN IF EXISTS is_main;
    `);
  }
}
