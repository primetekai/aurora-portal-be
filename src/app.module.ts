import { LoggingInterceptor } from './app/interceptor/logging.interceptor';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CrawlModule, KSplatModule, PulsarModule } from './app';
import { NODE_ENV } from './config';

@Module({
  imports: [
    KSplatModule,
    ...(NODE_ENV === 'development' ? [CrawlModule] : []),
    ...(NODE_ENV === 'development' ? [PulsarModule] : []),
  ],

  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
