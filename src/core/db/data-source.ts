import 'dotenv/config';
import { DataSource } from 'typeorm';

const isCompiled = __filename.endsWith('.js');
const extension = isCompiled ? 'js' : 'ts';
const rootDir = isCompiled ? 'dist' : 'src';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [`${rootDir}/modules/**/*.entity.${extension}`],
  migrations: [`${rootDir}/core/db/migrations/*.${extension}`],
  synchronize: false,
});
