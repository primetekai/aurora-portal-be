import 'dotenv/config';

const NODE_ENV = process.env.NODE_ENV;
const PORT = process.env.NODE_APP_PORT;
const SWAGGER = process.env.NODE_APP_SWAGGER === 'true';
const MINIO_URL = process.env.NODE_APP_MINIO_URL || '';
const MINIO_PORT = process.env.NODE_APP_MINIO_PORT || '';
const MINIO_SSL = process.env.NODE_APP_MINIO_SSL || '';
const MINIO_ACCESS_KEY = process.env.NODE_APP_MINIO_ACCESS_KEY || '';
const MINIO_SECRET_KEY = process.env.NODE_APP_MINIO_SECRET_KEY || '';
const MINIO_BUCKET = process.env.NODE_APP_MINIO_BUCKET || '';
const MINIO_PATH_DIR = process.env.NODE_APP_MINIO_PATH_DIR || '';
const PURSAL_URL = process.env.NODE_APP_PURSAL_URL || '';
const PURSAL_TOKEN = process.env.NODE_APP_PURSAL_TOKEN || '';

export {
  NODE_ENV,
  PORT,
  SWAGGER,
  MINIO_URL,
  MINIO_PORT,
  MINIO_SSL,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MINIO_PATH_DIR,
  PURSAL_URL,
  PURSAL_TOKEN,
};
