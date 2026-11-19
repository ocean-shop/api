import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShopSettingsTable1789700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- One row per shop, created lazily on first read, so no backfill is
      -- needed for existing shops.
      CREATE TABLE IF NOT EXISTS shop_settings (
        shop_id UUID PRIMARY KEY,
        use_ukrposhta BOOLEAN NOT NULL DEFAULT false,
        use_phone_login BOOLEAN NOT NULL DEFAULT false,
        use_automatic_payment BOOLEAN NOT NULL DEFAULT false,
        use_one_click_purchase BOOLEAN NOT NULL DEFAULT false,
        -- Only the tokens a shop overrides; the API merges them over the
        -- defaults in code, so adding a token never needs a migration.
        color_scheme JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_shop_settings_shop
          FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
        CONSTRAINT chk_shop_settings_color_scheme_object
          CHECK (jsonb_typeof(color_scheme) = 'object')
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS shop_settings;
    `);
  }
}
