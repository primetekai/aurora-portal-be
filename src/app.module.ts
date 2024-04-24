import { LoggingInterceptor } from './app/interceptor/logging.interceptor';
import { Module } from '@nestjs/common';
import { typeOrmConfig } from './config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './app/auth/auth.module';
import { UploadModule } from './app/upload/upload.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LanguagesModule } from './app/languages/languages.module';
import { SectionsModule } from './app/sections/sections.module';
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    LanguagesModule,
    SectionsModule,
    UploadModule,
  ],

  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
