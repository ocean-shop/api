import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderContactFields1788300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders
      ADD COLUMN first_name VARCHAR(100) NULL,
      ADD COLUMN last_name VARCHAR(100) NULL,
      ADD COLUMN middle_name VARCHAR(100) NULL,
      ADD COLUMN email VARCHAR(255) NULL,
      ADD COLUMN phone_number VARCHAR(30) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders
      DROP COLUMN IF EXISTS phone_number,
      DROP COLUMN IF EXISTS email,
      DROP COLUMN IF EXISTS middle_name,
      DROP COLUMN IF EXISTS last_name,
      DROP COLUMN IF EXISTS first_name;
    `);
  }
}
