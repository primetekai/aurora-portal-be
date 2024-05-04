import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { TransformInterceptor } from './app/interceptor/transform.interceptor';
import { PORT, SWAGGER } from './config';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new TransformInterceptor());

  // if (NODE_ENV === 'development') {
  //   app.enableCors();
  // }

  app.enableCors({
    origin: ['http://20.39.199.15:4000', 'http://20.39.199.15:8080'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  });

  if (SWAGGER) {
    setupSwagger(app);
  }

  await app.listen(PORT);

  logger.log(`Aplication listening on port ${PORT}`);
}

bootstrap();
