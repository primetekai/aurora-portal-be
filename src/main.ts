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

  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  if (SWAGGER) {
    setupSwagger(app);
  }

  await app.listen(PORT);

  logger.log(`Aplication listening on port ${PORT}`);
}

bootstrap();
