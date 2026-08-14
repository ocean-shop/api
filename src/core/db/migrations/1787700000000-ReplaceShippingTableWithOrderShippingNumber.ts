import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceShippingTableWithOrderShippingNumber1787700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE orders
            ADD COLUMN shipping_number VARCHAR(255) NOT NULL DEFAULT '';

            DROP INDEX IF EXISTS idx_orders_shipping_id;

            ALTER TABLE orders
            DROP COLUMN shipping_id;

            DROP TRIGGER IF EXISTS set_timestamp_shippings ON shippings;
            DROP TABLE IF EXISTS shippings;

            ALTER TABLE orders
            ALTER COLUMN shipping_number DROP DEFAULT;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE shippings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                line1 VARCHAR(255) NOT NULL,
                line2 VARCHAR(255),
                country VARCHAR(100) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100),
                postal_code VARCHAR(30) NOT NULL,
                phone VARCHAR(30) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TRIGGER set_timestamp_shippings
            BEFORE UPDATE ON shippings
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();

            ALTER TABLE orders
            ADD COLUMN shipping_id UUID;

            CREATE TEMP TABLE tmp_order_shipping_map AS
            SELECT id AS order_id, gen_random_uuid() AS shipping_id
            FROM orders;

            INSERT INTO shippings (
                id,
                line1,
                line2,
                country,
                city,
                state,
                postal_code,
                phone
            )
            SELECT
                map.shipping_id,
                CONCAT('Restored for ', o.order_number),
                NULL,
                'N/A',
                'N/A',
                NULL,
                'N/A',
                COALESCE(NULLIF(o.shipping_number, ''), 'N/A')
            FROM tmp_order_shipping_map map
            INNER JOIN orders o ON o.id = map.order_id;

            UPDATE orders o
            SET shipping_id = map.shipping_id
            FROM tmp_order_shipping_map map
            WHERE o.id = map.order_id;

            DROP TABLE tmp_order_shipping_map;

            ALTER TABLE orders
            ALTER COLUMN shipping_id SET NOT NULL;

            ALTER TABLE orders
            ADD CONSTRAINT orders_shipping_id_fkey
            FOREIGN KEY (shipping_id) REFERENCES shippings(id);

            CREATE INDEX idx_orders_shipping_id ON orders(shipping_id);

            ALTER TABLE orders
            DROP COLUMN shipping_number;
        `);
  }
}
