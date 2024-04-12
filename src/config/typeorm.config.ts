import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  DB_HOSTNAME,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USERNAME,
  TYPEORM_SYNC,
} from './platform.configs';

// get từ file yml ra
// ĐỒng thời setup connect server luôn server amazon
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: DB_HOSTNAME,
  port: DB_PORT,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: TYPEORM_SYNC,
  autoLoadEntities: true,
};
