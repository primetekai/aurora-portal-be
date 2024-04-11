import { LoggingInterceptor } from './interceptor/logging.interceptor';
import { Module } from '@nestjs/common';
import { TasksModule } from './tasks/tasks.module';
import { typeOrmConfig } from './config/typeorm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { UploadModule } from './upload/upload.module';
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
