import 'dotenv/config';

const PORT = process.env.NODE_APP_PORT ?? '8000';
const HOST_NAME = process.env.NODE_APP_HOST_NAME ?? 'localhost';
const DB_HOSTNAME = process.env.NODE_APP_DB_HOSTNAME ?? 'localhost';
const DB_PORT = Number(process.env.NODE_APP_DB_PORT) ?? 5433;
const DB_TYPE = process.env.NODE_APP_DB_TYPE ?? 'postgres';
const DB_USERNAME = process.env.NODE_APP_DB_USERNAME ?? 'postgres';
const DB_PASSWORD = process.env.NODE_APP_DB_PASSWORD ?? 'root';
const DB_NAME = process.env.NODE_APP_DB_NAME ?? 'root';
const TYPEORM_SYNC = (process.env.NODE_APP_TYPEORM_SYNC || true) === true;
const JWT_SECRET = process.env.NODE_APP_JWT_SECRET ?? 'topSecret51';
const EX_PIRES_IN = process.env.NODE_APP_EX_PIRES_IN ?? 3600;

export {
  PORT,
  HOST_NAME,
  DB_HOSTNAME,
  DB_PORT,
  DB_TYPE,
  DB_USERNAME,
  DB_PASSWORD,
  DB_NAME,
  TYPEORM_SYNC,
  JWT_SECRET,
  EX_PIRES_IN,
};
