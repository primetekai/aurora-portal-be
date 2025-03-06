import { Module } from '@nestjs/common';
import { KSplatController } from './ksplat.controller';
import { KSplatService } from './ksplat.service';
import { AuthModule } from 'src/app/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConvertService, MinIOService } from './service';

@Module({
  imports: [TypeOrmModule.forFeature([]), AuthModule],
  controllers: [KSplatController],
  providers: [KSplatService, ConvertService, MinIOService],
})
export class KSplatModule {}
