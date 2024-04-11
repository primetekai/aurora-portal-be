import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
//tạo log teminal
import { Logger } from '@nestjs/common';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { PORT } from './config';
async function bootstrap() {
  // new logger
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  //

  //interceptor
  // app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new TransformInterceptor());
  // app.useGlobalInterceptors(new ErrorsInterceptor());
  // app.useGlobalInterceptors(new ExcludeNullInterceptor());
  // app.useGlobalInterceptors(new TimeoutInterceptor());

  ///
  //cors  là một chính sách liên quan đến bảo mật được cài đặt vào toàn bộ các trình duyệt hiện nay.
  // xong qua packejon sửa NODE_ENV =devlelopment nodemon
  // Hiện tại nest js lúc khởi tạo ko có node module nên ko check đc khi lên production nhớ tắt dòng dưới
  // if(process.env.NODE_ENV ==='devlopment'){
  app.enableCors();
  // }

  // Lấy từ default or file env (env ưu tiên hơn)
  // test: $  PORT=3005 yarn start:dev
  await app.listen(PORT);
  //Xuất ra màn hình teminal
  logger.log(`Aplication listening on port ${PORT}`);
}
bootstrap();
