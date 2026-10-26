import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersProfileTable1788500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users_profile (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        full_name VARCHAR(300) NULL,
        phone_number VARCHAR(30) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TRIGGER set_timestamp_users_profile
      BEFORE UPDATE ON users_profile
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_timestamp();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS set_timestamp_users_profile ON users_profile;
      DROP TABLE IF EXISTS users_profile;
    `);
  }
}
