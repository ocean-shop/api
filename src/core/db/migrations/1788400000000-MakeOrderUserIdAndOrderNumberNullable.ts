import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeOrderUserIdAndOrderNumberNullable1788400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders
      ALTER COLUMN user_id DROP NOT NULL,
      ALTER COLUMN order_number DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders
      ALTER COLUMN order_number SET NOT NULL,
      ALTER COLUMN user_id SET NOT NULL;
    `);
  }
}
