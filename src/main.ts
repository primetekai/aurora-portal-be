import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { TransformInterceptor } from './app/interceptor/transform.interceptor';
import { NODE_ENV, PORT, SWAGGER, WHITE_LIST_IP } from './config';
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

  console.log('hack', WHITE_LIST_IP);
  if (SWAGGER) {
    setupSwagger(app);
  }

  await app.listen(PORT);

  logger.log(`Aplication listening on port ${PORT}`);
}

bootstrap();
