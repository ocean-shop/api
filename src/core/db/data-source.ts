import 'dotenv/config';
import { DataSource } from 'typeorm';
import {
  DB_FILE_EXTENSION,
  DB_ROOT_DIR,
  MIGRATION_DATABASE_URL,
} from './constants/db.constants';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: MIGRATION_DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [`${DB_ROOT_DIR}/modules/**/*.entity.${DB_FILE_EXTENSION}`],
  migrations: [`${DB_ROOT_DIR}/core/db/migrations/*.${DB_FILE_EXTENSION}`],
  synchronize: false,
});
