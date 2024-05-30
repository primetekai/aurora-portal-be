import { DynamicModule, Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

import { EmailModuleOptions } from './interfaces/email-options.interface';
import {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USERNAME,
  MAIL_PASSWORD,
  MAIL_TEMPLATE_DIR,
} from 'src/config';

const defaultConfig = {
  transport: {
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_SECURE,
    auth: {
      user: MAIL_USERNAME,
      pass: MAIL_PASSWORD,
    },
  },
  defaults: {
    forceEmbeddedImages: false,
    from: undefined,
  },
  templateDir: MAIL_TEMPLATE_DIR,
};

@Global()
@Module({})
export class EmailCoreModule {
  static forRoot(userConfig: EmailModuleOptions): DynamicModule {
    const EmailConfig = EmailCoreModule.getEmailConfig(userConfig);
    return {
      module: EmailCoreModule,
      providers: [EmailService, EmailConfig],
      exports: [EmailService],
    };
  }
  static getEmailConfig(userConfig?: EmailModuleOptions) {
    const config: EmailModuleOptions = { ...defaultConfig, ...userConfig };
    return {
      name: 'EMAIL_CONFIG',
      provide: 'EMAIL_CONFIG',
      useValue: {
        transport: config.transport,
        defaults: config.defaults,
        templateDir: config.templateDir,
      } as EmailModuleOptions,
    };
  }
}
