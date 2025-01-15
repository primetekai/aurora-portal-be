import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Crawl } from './crawl.entity';
import { Logger } from '@nestjs/common/services/logger.service';
import moment from 'moment';

@Injectable()
export class CrawlRepository extends Repository<Crawl> {
  private logger = new Logger('SectionsRepository');

  constructor(private dataSource: DataSource) {
    super(Crawl, dataSource.createEntityManager());
  }

  async createCrawl(data: Record<string, any>): Promise<Crawl> {
    const sectionEntity = new Crawl();
    sectionEntity.data = JSON.stringify(data);
    sectionEntity.createAt = new Date(moment().format('YYYY-MM-DD HH:mm:ss'));

    try {
      await sectionEntity.save();
      return sectionEntity;
    } catch (error) {
      this.logger.error(
        `Failed to create a crawl. Data: ${JSON.stringify(data)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
