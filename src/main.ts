import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { TransformInterceptor } from './app/interceptor/transform.interceptor';
import { NODE_ENV, PORT, SWAGGER } from './config';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new TransformInterceptor());

  app.enableCors({
    origin: [
      'http://20.39.199.15:4000',
      'http://20.39.199.15:8080',
      'http://127.0.0.1:3001',
    ],
    credentials: true,
  });

  if (NODE_ENV === 'development') {
    app.enableCors();
  }

  if (SWAGGER) {
    setupSwagger(app);
  }

  await app.listen(PORT);

  logger.log(`Aplication listening on port ${PORT}`);
}

bootstrap();
