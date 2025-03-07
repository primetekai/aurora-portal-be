import { LoggingInterceptor } from './app/interceptor/logging.interceptor';
import { Module } from '@nestjs/common';
import { typeOrmConfig } from './config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import {
  // AuthModule,
  // LanguagesModule,
  // AdminSectionsModule,
  // SectionsModule,
  // UserModule,
  CrawlModule,
  KSplatModule,
} from './app';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    // AuthModule,
    // UserModule,
    // LanguagesModule,
    // AdminSectionsModule,
    // SectionsModule,
    CrawlModule,
    KSplatModule,
    // UploadModule,
    // SpeedToTextModule,
  ],

  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
