import { Injectable } from '@nestjs/common';
import { CrawlRepository } from './crawl-view-360.repository';
import { Crawl } from './crawl-view-360.entity';
import { captureGoogleEarth, crawlSnapShotScreenWebService } from './service';

@Injectable()
export class CrawlService {
  constructor(private sectionsRepository: CrawlRepository) {}

  async crawlDataWithSource(data: Record<string, any>): Promise<Crawl> {
    return this.sectionsRepository.createCrawl(data);
  }

  async crawlSnapShotScreenWeb(phoneNumber, source): Promise<any> {
    return crawlSnapShotScreenWebService(phoneNumber, source);
  }

  async crawlCaptureGoogleEarth(location: string): Promise<any> {
    return captureGoogleEarth(location);
  }
}
