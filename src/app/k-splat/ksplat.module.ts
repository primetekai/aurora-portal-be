import { Module } from '@nestjs/common';
import { KSplatController } from './ksplat.controller';
import { KSplatService } from './ksplat.service';
import { ConvertService, MinIOService } from './service';
import { CreateKSplatService } from './service/create-ksplat.service';

@Module({
  imports: [],
  controllers: [KSplatController],
  providers: [KSplatService, CreateKSplatService, ConvertService, MinIOService],
})
export class KSplatModule {}
