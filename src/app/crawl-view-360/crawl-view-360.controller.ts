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
      console.error('❌ Lỗi khi tạo ảnh chụp màn hình:', error);
      throw new HttpException(
        'Không thể tạo ảnh chụp màn hình',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('generate-image-view-360')
  @ApiQuery({
    name: 'location',
    required: true,
    description: 'Vị trí muốn chụp ảnh 360 độ',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về URL của video 360 từ MinIO',
  })
  @ApiResponse({
    status: 400,
    description: 'Vị trí không hợp lệ!',
  })
  @ApiResponse({
    status: 500,
    description: 'Lỗi trong quá trình chụp ảnh',
  })
  async generateImage360(
    @Query('location') location: string,
    @Res() res: Response,
  ) {
    if (!location) {
      throw new HttpException(
        '❌ Thiếu tham số location!',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      console.log(`🌍 Bắt đầu chụp ảnh 360 độ tại vị trí: ${location}`);

      // 📌 Lấy đường link tải video từ MinIO
      const result = await this.crawlService.crawlCaptureGoogleEarth(location);

      if (!result || !result.downloadUrl) {
        throw new Error('Lỗi khi tải video lên MinIO');
      }

      console.log(`✅ Video đã tải lên MinIO: ${result.downloadUrl}`);

      res.set({ 'Content-Type': 'application/json' });
      return res.json({
        message: '✅ Thành công!',
        downloadUrl: result.downloadUrl, // Trả về URL video từ MinIO
      });
    } catch (error) {
      console.error('❌ Lỗi khi chụp ảnh Google Earth 360:', error);
      throw new HttpException(
        'Không thể tạo video 360 độ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
