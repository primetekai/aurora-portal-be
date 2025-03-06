import { Module } from '@nestjs/common';
import { CrawlController } from './crawl-view-360.controller';
import { CrawlService } from './crawl-view-360.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlRepository } from './crawl-view-360.repository';
import { AuthModule } from 'src/app/auth/auth.module';
import { MinIOService } from '../k-splat/service';

@Module({
  imports: [TypeOrmModule.forFeature([CrawlRepository]), AuthModule],
  controllers: [CrawlController],
  providers: [CrawlService, MinIOService, CrawlRepository],
})
export class CrawlModule {}
