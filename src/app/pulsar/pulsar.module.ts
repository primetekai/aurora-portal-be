import { Module } from '@nestjs/common';
import { PulsarService } from './pulsar.service';
import { CrawlService } from '../crawl-view-360';
import { MinIOService } from '../k-splat/service';

@Module({
  imports: [],
  controllers: [],
  providers: [PulsarService, CrawlService, MinIOService],
})
export class PulsarModule {}
