import { Module } from '@nestjs/common';
import { AzureStorageService } from './azure-storage.service';
import { FilesController } from './azure-storage.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FilesController],
  providers: [AzureStorageService],
})
export class FilesModule {}
