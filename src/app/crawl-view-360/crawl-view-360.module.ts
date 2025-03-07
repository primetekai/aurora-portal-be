import { Module } from '@nestjs/common';
import { CrawlController } from './crawl-view-360.controller';
import { CrawlService } from './crawl-view-360.service';
import { MinIOService } from '../k-splat/service';

@Module({
  imports: [],
  controllers: [CrawlController],
  providers: [CrawlService, MinIOService],
})
export class CrawlModule {}
