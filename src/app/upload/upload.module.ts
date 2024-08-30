import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { AuthModule } from '@app/auth';
@Module({
  imports: [AuthModule],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
