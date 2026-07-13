import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShopSchema1783403695573 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE product_type AS ENUM ('simple', 'variable');
            CREATE TYPE product_status AS ENUM ('draft', 'active', 'inactive');

            CREATE TABLE shops (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                url VARCHAR(500),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE users_shops (
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                PRIMARY KEY(user_id, shop_id)
            );

            CREATE TABLE categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                type product_type NOT NULL DEFAULT 'simple',
                name VARCHAR(255) NOT NULL,
                description TEXT,
                landing TEXT,
                status product_status NOT NULL DEFAULT 'draft',
                available BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE product_variations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                sku VARCHAR(100),
                name VARCHAR(255),
                price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
                old_price DECIMAL(10,2) CHECK (old_price IS NULL OR old_price >= 0),
                available BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT product_variations_old_price_gte_price_check
                    CHECK (old_price IS NULL OR old_price >= price)
            );

            CREATE TABLE attribute_types (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                sort INT NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(shop_id, name)
            );

            CREATE TABLE attribute_values (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                attribute_type_id UUID NOT NULL REFERENCES attribute_types(id) ON DELETE CASCADE,
                value VARCHAR(255) NOT NULL,
                sort INT NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(attribute_type_id, value)
            );

            CREATE TABLE variation_attribute_values (
                variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
                attribute_value_id UUID NOT NULL REFERENCES attribute_values(id) ON DELETE CASCADE,
                PRIMARY KEY(variation_id, attribute_value_id)
            );

            CREATE TABLE product_attributes (
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                attribute_type_id UUID NOT NULL REFERENCES attribute_types(id) ON DELETE CASCADE,
                value VARCHAR(255),
                PRIMARY KEY(product_id, attribute_type_id)
            );

            CREATE TABLE product_images (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                url VARCHAR(1000) NOT NULL,
                sort INT NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE variation_images (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                variation_id UUID NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
                url VARCHAR(1000) NOT NULL,
                sort INT NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE tags (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(shop_id, name)
            );

            CREATE TABLE products_tags (
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
                PRIMARY KEY(product_id, tag_id)
            );

            CREATE TABLE products_categories (
                product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
                PRIMARY KEY(product_id, category_id)
            );

            CREATE UNIQUE INDEX uq_categories_shop_root_slug
                ON categories(shop_id, slug)
                WHERE parent_id IS NULL;

            CREATE UNIQUE INDEX uq_categories_shop_parent_slug
                ON categories(shop_id, parent_id, slug)
                WHERE parent_id IS NOT NULL;

            CREATE INDEX idx_users_shops_shop_id ON users_shops(shop_id);
            CREATE INDEX idx_categories_shop_id ON categories(shop_id);
            CREATE INDEX idx_categories_parent_id ON categories(parent_id);
            CREATE INDEX idx_products_shop_id ON products(shop_id);
            CREATE INDEX idx_products_status ON products(status);
            CREATE INDEX idx_product_variations_product_id ON product_variations(product_id);
            CREATE INDEX idx_attribute_types_shop_id ON attribute_types(shop_id);
            CREATE INDEX idx_attribute_values_attribute_type_id ON attribute_values(attribute_type_id);
            CREATE INDEX idx_variation_attribute_values_attribute_value_id ON variation_attribute_values(attribute_value_id);
            CREATE INDEX idx_product_attributes_attribute_type_id ON product_attributes(attribute_type_id);
            CREATE INDEX idx_product_images_product_id ON product_images(product_id);
            CREATE INDEX idx_variation_images_variation_id ON variation_images(variation_id);
            CREATE INDEX idx_tags_shop_id ON tags(shop_id);
            CREATE INDEX idx_products_tags_tag_id ON products_tags(tag_id);
            CREATE INDEX idx_products_categories_category_id ON products_categories(category_id);

            CREATE TRIGGER set_timestamp_shops
            BEFORE UPDATE ON shops
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();

            CREATE TRIGGER set_timestamp_categories
            BEFORE UPDATE ON categories
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();

            CREATE TRIGGER set_timestamp_products
            BEFORE UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();

            CREATE TRIGGER set_timestamp_product_variations
            BEFORE UPDATE ON product_variations
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();

            CREATE TRIGGER set_timestamp_attribute_types
            BEFORE UPDATE ON attribute_types
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();

            CREATE TRIGGER set_timestamp_attribute_values
            BEFORE UPDATE ON attribute_values
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();

            CREATE TRIGGER set_timestamp_product_images
            BEFORE UPDATE ON product_images
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();

            CREATE TRIGGER set_timestamp_variation_images
            BEFORE UPDATE ON variation_images
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();

            CREATE TRIGGER set_timestamp_tags
            BEFORE UPDATE ON tags
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TRIGGER IF EXISTS set_timestamp_tags ON tags;
            DROP TRIGGER IF EXISTS set_timestamp_variation_images ON variation_images;
            DROP TRIGGER IF EXISTS set_timestamp_product_images ON product_images;
            DROP TRIGGER IF EXISTS set_timestamp_attribute_values ON attribute_values;
            DROP TRIGGER IF EXISTS set_timestamp_attribute_types ON attribute_types;
            DROP TRIGGER IF EXISTS set_timestamp_product_variations ON product_variations;
            DROP TRIGGER IF EXISTS set_timestamp_products ON products;
            DROP TRIGGER IF EXISTS set_timestamp_categories ON categories;
            DROP TRIGGER IF EXISTS set_timestamp_shops ON shops;

            DROP TABLE IF EXISTS products_categories;
            DROP TABLE IF EXISTS products_tags;
            DROP TABLE IF EXISTS tags;
            DROP TABLE IF EXISTS variation_images;
            DROP TABLE IF EXISTS product_images;
            DROP TABLE IF EXISTS product_attributes;
            DROP TABLE IF EXISTS variation_attribute_values;
            DROP TABLE IF EXISTS attribute_values;
            DROP TABLE IF EXISTS attribute_types;
            DROP TABLE IF EXISTS product_variations;
            DROP TABLE IF EXISTS products;
            DROP TABLE IF EXISTS categories;
            DROP TABLE IF EXISTS users_shops;
            DROP TABLE IF EXISTS shops;

            DROP TYPE IF EXISTS product_status;
            DROP TYPE IF EXISTS product_type;
        `);
  }
}
