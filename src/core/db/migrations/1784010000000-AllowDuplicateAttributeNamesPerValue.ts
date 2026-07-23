import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowDuplicateAttributeNamesPerValue1784010000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE attribute_types
        DROP CONSTRAINT IF EXISTS attribute_types_shop_id_name_key;

      ALTER TABLE attribute_types
        DROP CONSTRAINT IF EXISTS attribute_types_shop_id_name_value_key;

      ALTER TABLE attribute_types
        ADD CONSTRAINT attribute_types_shop_id_name_value_key
          UNIQUE (shop_id, name, value);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE attribute_types
        DROP CONSTRAINT IF EXISTS attribute_types_shop_id_name_value_key;

      ALTER TABLE attribute_types
        ADD CONSTRAINT attribute_types_shop_id_name_key
          UNIQUE (shop_id, name);
    `);
  }
}
