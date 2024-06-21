import { LoggingInterceptor } from './app/interceptor/logging.interceptor';
import { Module } from '@nestjs/common';
import { typeOrmConfig } from './config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import {
  AuthModule,
  EmailConfirmModule,
  FilesModule,
  LanguagesModule,
  AdminSectionsModule,
  SectionsModule,
  UserModule,
} from './app';
import { TransactionModule } from './app/transaction';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UserModule,
    LanguagesModule,
    AdminSectionsModule,
    SectionsModule,
    FilesModule,
    TransactionModule,
    EmailConfirmModule,
  ],

  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
