import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTables1789400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE notification_type AS ENUM ('order_created', 'customer_registered');

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
        type notification_type NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Serves the admin feed of a shop, newest first.
      CREATE INDEX IF NOT EXISTS idx_notifications_shop_created
        ON notifications(shop_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS notification_reads (
        notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (notification_id, user_id)
      );

      -- Keeps the cascade on user deletion off a sequential scan.
      CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id
        ON notification_reads(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_notification_reads_user_id;
      DROP TABLE IF EXISTS notification_reads;
      DROP INDEX IF EXISTS idx_notifications_shop_created;
      DROP TABLE IF EXISTS notifications;
      DROP TYPE IF EXISTS notification_type;
    `);
  }
}
