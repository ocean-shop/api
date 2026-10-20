const isCompiled = __filename.endsWith('.js');

export const DB_FILE_EXTENSION = isCompiled ? 'js' : 'ts';
export const DB_ROOT_DIR = isCompiled ? 'dist' : 'src';

// Only the TypeORM CLI reads this config; the app builds its own in AppModule.
// Migrations run from a pre-deploy container, which asks for the private
// *.railway.internal name before that network has finished coming up and fails
// with ENOTFOUND. Pointing MIGRATION_DATABASE_URL at the public proxy keeps the
// one-off DDL off the private network, while the app itself stays on it.
export const MIGRATION_DATABASE_URL =
  process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
