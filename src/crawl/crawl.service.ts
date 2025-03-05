import { Injectable } from '@nestjs/common';
import { CrawlRepository } from './crawl.repository';
import { Crawl } from './crawl.entity';
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
