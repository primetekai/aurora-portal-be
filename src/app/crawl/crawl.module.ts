import { Module } from '@nestjs/common';
import { CrawlController } from './crawl.controller';
import { CrawlService } from './crawl.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlRepository } from './crawl.repository';
import { AuthModule } from 'src/app/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([CrawlRepository]), AuthModule],
  controllers: [CrawlController],
  providers: [CrawlService, CrawlRepository],
})
export class CrawlModule {}
