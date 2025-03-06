import {
  Controller,
  Get,
  Res,
  HttpStatus,
  Logger,
  Query,
  HttpException,
} from '@nestjs/common';
import { CrawlService } from './crawl-view-360.service';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CRAWL_SERVICE } from 'src/config';
import { Response } from 'express';

@Controller(CRAWL_SERVICE)
@ApiTags('crawl')
export class CrawlController {
  private logger = new Logger('CrawlController');

  constructor(private crawlService: CrawlService) {}

  @Get('generate-image')
  @ApiQuery({
    name: 'url',
    required: true,
    description: 'URL của trang web cần chụp hình',
  })
  @ApiQuery({
    name: 'source',
    required: true,
    description: 'Nguồn của trang web (e.g., facebook, google)',
  })
  @ApiResponse({ status: 200, description: 'Trả về file ảnh của trang web' })
  @ApiResponse({
    status: 400,
    description: 'URL hoặc nguồn không hợp lệ',
  })
  async generateImage(
    @Query('url') url: string,
    @Query('source') source: string,
    @Res() res: Response,
  ) {
    try {
      const base64Image = await this.crawlService.crawlSnapShotScreenWeb(
        url,
        source,
      );
      res.set({ 'Content-Type': 'application/json' });
      return res.json({ base64: `data:image/png;base64,${base64Image}` });
    } catch (error) {
      console.error('Error generating screenshot:', error);
      throw new HttpException(
        'Failed to generate screenshot',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('generate-image-view-360')
  @ApiQuery({
    name: 'location',
    required: true,
    description: 'Location for the 360-degree view',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a base64-encoded image of the requested location',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid location provided!',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to capture the image',
  })
  async generateImage360(
    @Query('location') location: string,
    @Res() res: Response,
  ) {
    if (!location) {
      throw new HttpException(
        'Location parameter is required!',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const base64Image =
        await this.crawlService.crawlCaptureGoogleEarth(location);

      res.set({ 'Content-Type': 'application/json' });
      return res.json({ base64: `data:image/png;base64,${base64Image}` });
    } catch (error) {
      console.error('❌ Error capturing Google Earth screenshot:', error);
      throw new HttpException(
        'Failed to generate the screenshot',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
