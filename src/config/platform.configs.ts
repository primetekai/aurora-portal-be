import 'dotenv/config';

const NODE_ENV = process.env.NODE_ENV ?? 'production';
const PORT = process.env.NODE_APP_PORT ?? '3000';
const HOST_NAME = process.env.NODE_APP_HOST_NAME ?? 'localhost';
const DB_HOSTNAME = process.env.NODE_APP_DB_HOSTNAME ?? 'localhost';
const DB_PORT = Number(process.env.NODE_APP_DB_PORT) ?? 5434;
const DB_TYPE = process.env.NODE_APP_DB_TYPE ?? 'postgres';
const DB_USERNAME = process.env.NODE_APP_DB_USERNAME ?? 'postgres';
const DB_PASSWORD = process.env.NODE_APP_DB_PASSWORD ?? '123123';
const DB_NAME = process.env.NODE_APP_DB_NAME ?? 'postgres';
const TYPEORM_SYNC = Boolean(process.env?.NODE_APP_TYPEORM_SYNC || false);
const JWT_SECRET = process.env.NODE_APP_JWT_SECRET ?? 'topSecret51';
const EXPIRES_IN = process.env.NODE_APP_EXPIRES_IN ?? '10d';
const SWAGGER = Boolean(process.env.NODE_APP_SWAGGER || false);
const TYPE_IMAGE_FILE = process.env.NODE_APP_TYPE_IMAGE_FILE ?? [
  'image/jpeg',
  'image/png',
  'image/gif',
];
const TYPE_VIDEO_FILE = process.env.NODE_APP_TYPE_VIDEO_FILE ?? [
  'video/mp4',
  'video/avi',
  'video/mkv',
];
const MAX_SIZE_OF_IMAGE_FILE =
  process.env.NODE_APP_MAX_SIZE_OF_IMAGE_FILE ?? 2097152;
const UPLOAD_FILE_PATH = process.env.NODE_APP_MAX_UPLOAD_FILE_PATH;
const MAX_SIZE_OF_VIDEO_FILE =
  process.env.NODE_APP_MAX_SIZE_OF_VIDEO_FILE ?? 104857600;
const OPENAI_API_KEY = process.env.NODE_APP_OPENAI_API_KEY;

export {
  NODE_ENV,
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
  EXPIRES_IN,
  SWAGGER,
  TYPE_IMAGE_FILE,
  MAX_SIZE_OF_IMAGE_FILE,
  UPLOAD_FILE_PATH,
  MAX_SIZE_OF_VIDEO_FILE,
  TYPE_VIDEO_FILE,
  OPENAI_API_KEY,
};
