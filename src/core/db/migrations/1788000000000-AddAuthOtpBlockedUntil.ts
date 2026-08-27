import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthOtpBlockedUntil1788000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE auth_otps
      ADD COLUMN blocked_until TIMESTAMPTZ;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE auth_otps
      DROP COLUMN IF EXISTS blocked_until;
    `);
  }
}
