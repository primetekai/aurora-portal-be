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
    description: 'URL of the webpage to capture',
  })
  @ApiQuery({
    name: 'source',
    required: true,
    description: 'Source of the webpage (e.g., Facebook, Google)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the screenshot of the webpage',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid URL or source',
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
      console.error('❌ Error generating screenshot:', error);
      throw new HttpException(
        'Unable to generate screenshot',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('generate-image-view-360')
  @ApiQuery({
    name: 'location',
    required: true,
    description: 'Location to capture a 360-degree image',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the URL of the 360-degree video from MinIO',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid location!',
  })
  @ApiResponse({
    status: 500,
    description: 'Error during the image capture process',
  })
  async generateImage360(
    @Query('location') location: string,
    @Res() res: Response,
  ) {
    if (!location) {
      throw new HttpException(
        '❌ Missing location parameter!',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      console.log(
        `🌍 Starting 360-degree image capture at location: ${location}`,
      );

      // 📌 Retrieve the video download link from MinIO
      const result = await this.crawlService.crawlCaptureGoogleEarth(location);

      if (!result || !result.videoPath || !result.videoZoomPath) {
        throw new Error('Error uploading video to MinIO');
      }

      console.log(
        `✅ Video successfully uploaded to MinIO: ${result.downloadUrl} ${result.videoZoomPath}`,
      );

      res.set({ 'Content-Type': 'application/json' });
      return res.json({
        message: '✅ Success!',
        videoPath: result.videoPath, // Return the MinIO video URL
        videoZoomPath: result.videoZoomPath, // Return the MinIO video URL
      });
    } catch (error) {
      console.error('❌ Error capturing Google Earth 360 image:', error);
      throw new HttpException(
        'Unable to generate 360-degree video',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
