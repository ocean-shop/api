import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersProfileBirthday1788700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users_profile
      ADD COLUMN IF NOT EXISTS birthday DATE NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users_profile
      DROP COLUMN IF EXISTS birthday;
    `);
  }
}
