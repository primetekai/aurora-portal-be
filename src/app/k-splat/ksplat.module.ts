import { Module } from '@nestjs/common';
import { KSplatController } from './ksplat.controller';
import { KSplatService } from './ksplat.service';
import { ConvertService, MinIOService } from './service';

@Module({
  imports: [],
  controllers: [KSplatController],
  providers: [KSplatService, ConvertService, MinIOService],
})
export class KSplatModule {}
