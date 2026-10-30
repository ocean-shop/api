import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManualOrderPaymentMethod1789200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE order_payment_method ADD VALUE IF NOT EXISTS 'manual';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres cannot drop an enum value, so the type is recreated without it.
    // The cast fails if any order still uses 'manual'; migrate those rows first.
    await queryRunner.query(`
      ALTER TYPE order_payment_method RENAME TO order_payment_method_old;
    `);
    await queryRunner.query(`
      CREATE TYPE order_payment_method AS ENUM ('card', 'cod');
    `);
    await queryRunner.query(`
      ALTER TABLE orders
      ALTER COLUMN payment_method TYPE order_payment_method
      USING payment_method::text::order_payment_method;
    `);
    await queryRunner.query(`
      DROP TYPE order_payment_method_old;
    `);
  }
}
