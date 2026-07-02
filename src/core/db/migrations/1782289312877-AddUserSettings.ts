import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSettings1782289312877 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE user_language AS ENUM ('en', 'ua', 'ru');

            CREATE TABLE user_settings (
                user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                language user_language NOT NULL DEFAULT 'en',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TRIGGER set_timestamp_user_settings
            BEFORE UPDATE ON user_settings
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TRIGGER IF EXISTS set_timestamp_user_settings ON user_settings;
            DROP TABLE IF EXISTS user_settings;
            DROP TYPE IF EXISTS user_language;
        `);
  }
}
