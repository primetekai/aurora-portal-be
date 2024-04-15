import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { MulterModule } from '@nestjs/platform-express/multer/multer.module';

@Module({
  imports: [
    MulterModule.register({
      dest: 'uploads',
    }),
  ],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
