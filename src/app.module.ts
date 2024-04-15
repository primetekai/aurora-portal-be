import { LoggingInterceptor } from './app/interceptor/logging.interceptor';
import { Module } from '@nestjs/common';
import { TasksModule } from './app/tasks/tasks.module';
import { typeOrmConfig } from './config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './app/auth/auth.module';
import { ProductsModule } from './app/products/products.module';
import { UploadModule } from './app/upload/upload.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TasksModule,
    AuthModule,
    ProductsModule,
    UploadModule,
  ],

  // interceptor sau khi tao gloabl moi them o day
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
