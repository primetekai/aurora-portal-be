import { IEnvironment } from './ienvironment';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Algorithm, Secret } from 'jsonwebtoken';
import {
  DB_CONNECTION,
  DB_HOST,
  DB_PORT,
  DB_DATABASE,
  DB_USERNAME,
  DB_PASSWORD,
  TYPEORM_KEEPCONNECTIONALIVE,
  TYPEORM_LOGGING,
  TYPEORM_SYNCHRONIZE,
  TYPEORM_UUID_EXTENSION,
  APP_ENV,
  APP_DEBUG,
  USER_PASSWORD_BCRYPT_SALT_ROUNDS,
  JWT_SECRET,
  JWT_SIGN_OPTIONS_ALGORITHM,
  JWT_SIGN_OPTIONS_EXPIRESIN,
  APP_URL,
  APP_PORT,
  APP_URL_PREFIX,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USERNAME,
  MAIL_PASSWORD,
  MAIL_FROM_ADDRESS,
  MAIL_TEMPLATE_DIR,
  SWAGGER_ENABLED,
  SWAGGER_PATH,
  IMAGE_PATH,
  IMAGE_API,
  BARCODE,
  TWILIO_NUMBER,
  TWILIO_SID,
  TWILIO_AUTH,
  PRODUCT_TEMPLATES_PATH,
  UPLOAD_FILE_PATH,
  EXPIRE_TIME,
  EMAIL_SECURE,
  OIDC_ISSUER_INTERNAL_URL,
  VAPID_PRIVATE_KEY,
  VAPID_PUBLIC_KEY,
  OIDC_ISSUER_EXTERNAL_URL,
  OIDC_CLIENT_ID,
  VAPID_SUBJECT,
} from 'src/config';

function getDatabaseConfig(): TypeOrmModuleOptions {
  switch (DB_CONNECTION) {
    case 'postgres':
      const databaseConfig: TypeOrmModuleOptions = {
        type: 'postgres',
        host: DB_HOST || 'localhost',
        port: DB_PORT,
        database: DB_DATABASE || 'postgres',
        username: DB_USERNAME || 'postgres',
        password: DB_PASSWORD || 'root',
        keepConnectionAlive: TYPEORM_KEEPCONNECTIONALIVE
          ? JSON.parse(TYPEORM_KEEPCONNECTIONALIVE)
          : false,
        logging: TYPEORM_LOGGING ? JSON.parse(TYPEORM_LOGGING) : false,
        synchronize: TYPEORM_SYNCHRONIZE
          ? JSON.parse(TYPEORM_SYNCHRONIZE)
          : false,
        uuidExtension: <'pgcrypto' | 'uuid-ossp'>TYPEORM_UUID_EXTENSION,
      };
      return databaseConfig;
      break;
  }
}

const databaseConfig = getDatabaseConfig();
console.info(`DB Config: ${JSON.stringify(databaseConfig)}`);

export const environment: IEnvironment = {
  production: APP_ENV === 'production',
  debug: APP_DEBUG ? JSON.parse(APP_DEBUG) : false,
  env: APP_ENV,

  ALLOW_WHITE_LIST: ['::ffff:127.0.0.1', '::1'],

  userPasswordBcryptSaltRounds: USER_PASSWORD_BCRYPT_SALT_ROUNDS
    ? parseInt(USER_PASSWORD_BCRYPT_SALT_ROUNDS, 10)
    : 12,

  jwt: {
    secretOrKey: JWT_SECRET as Secret,
    signOptions: {
      algorithm: JWT_SIGN_OPTIONS_ALGORITHM as Algorithm,
      expiresIn: JWT_SIGN_OPTIONS_EXPIRESIN as string | number,
    },
  },

  server: {
    host: APP_URL,
    domainUrl: APP_URL + ':' + APP_PORT,
    port: APP_PORT || 3000,
    globalPrefix: APP_URL_PREFIX,
  },

  databases: [databaseConfig],

  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  },

  auth: {
    clientId: OIDC_CLIENT_ID || 'ngxapi',
    issuerExternalUrl:
      OIDC_ISSUER_EXTERNAL_URL ||
      'https://keycloak.traefik.k8s/auth/realms/ngx',
    issuerInternalUrl:
      OIDC_ISSUER_INTERNAL_URL ||
      'http://keycloak-headless:8080/auth/realms/ngx',
  },

  email: {
    transport: {
      host: MAIL_HOST || 'mail.google.com',
      port: MAIL_PORT ? Number(MAIL_PORT) : 25,
      secure: EMAIL_SECURE ? JSON.parse(MAIL_SECURE) : false,
      auth: {
        user: MAIL_USERNAME || 'auth_user',
        pass: MAIL_PASSWORD || 'auth_pass',
      },
    },
    defaults: {
      from: MAIL_FROM_ADDRESS
        ? MAIL_FROM_ADDRESS
        : '"sumo demo" <sumo@demo.com>',
    },
    templateDir: MAIL_TEMPLATE_DIR || `${__dirname}/assets/email-templates`,
  },

  weather: {
    baseUrl: 'https://samples.openweathermap.org/data/2.5',
    apiKey: 'b6907d289e10d714a6e88b30761fae22',
  },

  // Key generation: https://web-push-codelab.glitch.me
  webPush: {
    subject: VAPID_SUBJECT || 'mailto: sumo@demo.com',
    publicKey:
      VAPID_PUBLIC_KEY ||
      'BAJq-yHlSNjUqKW9iMY0hG96X9WdVwetUFDa5rQIGRPqOHKAL_fkKUe_gUTAKnn9IPAltqmlNO2OkJrjdQ_MXNg',
    privateKey:
      VAPID_PRIVATE_KEY || 'cwh2CYK5h_B_Gobnv8Ym9x61B3qFE2nTeb9BeiZbtMI',
  },

  swagger: {
    enable: SWAGGER_ENABLED ? JSON.parse(SWAGGER_ENABLED) : false,
    title: 'Headless CMS API Docs',
    description: 'Headless CMS API Docs',
    welcomeText: 'Welcome to Headless API',
    path: SWAGGER_PATH,
  },

  images: {
    path: IMAGE_PATH,
    api: IMAGE_API,
  },

  barcode: BARCODE,

  twilio: {
    number: TWILIO_NUMBER,
    sid: TWILIO_SID,
    auth: TWILIO_AUTH,
    content: 'Your confirm number is ',
  },

  productTemplate: {
    path: PRODUCT_TEMPLATES_PATH,
  },

  productExport: {
    path: UPLOAD_FILE_PATH,
  },

  code: {
    expireTime: eval(EXPIRE_TIME),
  },
};

export default environment;
