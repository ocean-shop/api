import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrdersSchema1787600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE order_payment_method AS ENUM ('card', 'cod');
            CREATE TYPE order_payment_status AS ENUM ('unpaid', 'paid');
            CREATE TYPE order_shipping_method AS ENUM ('nova', 'ukr');
            CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'cancelled');

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

            CREATE TABLE orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                shipping_id UUID NOT NULL REFERENCES shippings(id),
                order_number VARCHAR(100) NOT NULL,
                subtotal_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal_amount >= 0),
                discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
                total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
                payment_method order_payment_method NOT NULL,
                payment_status order_payment_status NOT NULL DEFAULT 'unpaid',
                shipping_method order_shipping_method NOT NULL,
                status order_status NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_orders_shop_order_number UNIQUE(shop_id, order_number)
            );

            CREATE TABLE orders_products (
                order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
                quantity INT NOT NULL CHECK (quantity > 0),
                PRIMARY KEY(order_id, product_id)
            );

            CREATE INDEX idx_orders_shop_id ON orders(shop_id);
            CREATE INDEX idx_orders_user_id ON orders(user_id);
            CREATE INDEX idx_orders_shipping_id ON orders(shipping_id);
            CREATE INDEX idx_orders_products_product_id ON orders_products(product_id);

            CREATE TRIGGER set_timestamp_shippings
            BEFORE UPDATE ON shippings
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();

            CREATE TRIGGER set_timestamp_orders
            BEFORE UPDATE ON orders
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TRIGGER IF EXISTS set_timestamp_orders ON orders;
            DROP TRIGGER IF EXISTS set_timestamp_shippings ON shippings;

            DROP INDEX IF EXISTS idx_orders_products_product_id;
            DROP INDEX IF EXISTS idx_orders_shipping_id;
            DROP INDEX IF EXISTS idx_orders_user_id;
            DROP INDEX IF EXISTS idx_orders_shop_id;

            DROP TABLE IF EXISTS orders_products;
            DROP TABLE IF EXISTS orders;
            DROP TABLE IF EXISTS shippings;

            DROP TYPE IF EXISTS order_status;
            DROP TYPE IF EXISTS order_shipping_method;
            DROP TYPE IF EXISTS order_payment_status;
            DROP TYPE IF EXISTS order_payment_method;
        `);
  }
}
