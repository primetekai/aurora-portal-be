import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { NODE_ENV, PORT } from './config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new TransformInterceptor());

  if (NODE_ENV === 'development') {
    app.enableCors();
  }

  const config = new DocumentBuilder()
    .setTitle('Backend app')
    .setDescription('Backend app API')
    .setVersion('1.0')
    .addTag('be-apps')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(PORT);

  logger.log(`Aplication listening on port ${PORT}`);
}

bootstrap();
