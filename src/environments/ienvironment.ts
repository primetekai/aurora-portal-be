import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EmailModuleOptions } from '../app/email';
import { IJwtConfigInterface } from './jwt.config.interface';

/**
 * Server Environment
 */
export interface IEnvironment {
  production: boolean;
  debug: boolean;
  env: string;

  ALLOW_WHITE_LIST?: Array<string>;

  userPasswordBcryptSaltRounds?: number;

  jwt: IJwtConfigInterface,

  server: {
    host: string;
    domainUrl: string;
    port: string | number;
    globalPrefix: string;
  };

  databases: TypeOrmModuleOptions[];

  redis: {
    host: string;
    port: string;
    password: string;
  };

  auth: {
    clientId: string;
    issuerExternalUrl: string;
    issuerInternalUrl?: string;
    jwksUri?: string;
    additionalQueryStringParams?: Partial<{
      scope: string;
      nonce: string;
      audience: string;
      [key: string]: string;
    }>;
  };

  email: EmailModuleOptions;

  weather: {
    baseUrl: string;
    apiKey: string;
  };

  webPush: {
    subject: string;
    publicKey: string;
    privateKey: string;
  };

  swagger: {
    enable: boolean,
    title: string,
    description: string,
    welcomeText: string,
    path: string
  };

  images: {
    path: string,
    api: string
  };

  barcode: string;

  twilio: {
    number: string,
    sid: string,
    auth: string,
    content: string
  };

  productTemplate: {
    path: string;
  };

  productExport: {
    path: string;
  },

  code: {
    expireTime: number;
  }
}
