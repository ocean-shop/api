import 'dotenv/config';
import { DataSource } from 'typeorm';

const isCompiled = __filename.endsWith('.js');
const extension = isCompiled ? 'js' : 'ts';
const rootDir = isCompiled ? 'dist' : 'src';

// Only the TypeORM CLI reads this config; the app builds its own in AppModule.
// Migrations run from a pre-deploy container, which asks for the private
// *.railway.internal name before that network has finished coming up and fails
// with ENOTFOUND. Pointing MIGRATION_DATABASE_URL at the public proxy keeps the
// one-off DDL off the private network, while the app itself stays on it.
const migrationUrl =
  process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: migrationUrl,
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [`${rootDir}/modules/**/*.entity.${extension}`],
  migrations: [`${rootDir}/core/db/migrations/*.${extension}`],
  synchronize: false,
});
