import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CrawlRepository } from './crawl-view-360.repository';
import { Crawl } from './crawl-view-360.entity';
import { captureGoogleEarth, crawlSnapShotScreenWebService } from './service';
import { MinIOService } from '../k-splat/service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CrawlService {
  constructor(
    private sectionsRepository: CrawlRepository,
    private readonly minioService: MinIOService,
  ) {}

  async crawlDataWithSource(data: Record<string, any>): Promise<Crawl> {
    return this.sectionsRepository.createCrawl(data);
  }

  async crawlSnapShotScreenWeb(phoneNumber, source): Promise<any> {
    return crawlSnapShotScreenWebService(phoneNumber, source);
  }

  // 🗑️ Hàm xóa file để tránh rác
  private deleteFile(filePath: string) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Đã xóa file tạm: ${filePath}`);
      }
    } catch (error) {
      console.error(`⚠️ Lỗi khi xóa file tạm: ${filePath} - ${error.message}`);
    }
  }

  async crawlCaptureGoogleEarth(location: string): Promise<any> {
    let outputFile: string | null = null; // 🔹 Định nghĩa outputFile trước

    console.log(`🌍 Bắt đầu quay video Google Earth tại vị trí: ${location}`);

    try {
      // 1️⃣ Quay video Google Earth
      outputFile = await captureGoogleEarth(location);
      console.log(`📽️ Video đã được tạo: ${outputFile}`);

      // Lấy tên file từ đường dẫn (Windows + Linux đều chạy đúng)
      const fileName = path.basename(outputFile);

      if (!fileName) {
        throw new Error('Không thể xác định tên file video.');
      }

      console.log(`📂 Tên file video: ${fileName}`);

      // 2️⃣ Upload file lên MinIO
      const minioDir = process.env.MINIO_PATH_DIR || '3gs_service';
      const minioPath = `${minioDir}/${fileName}`;

      console.log(`📤 Đang tải video lên MinIO tại: ${minioPath}`);

      const downloadUrl = await this.minioService.uploadFile(
        minioPath,
        outputFile,
      );

      if (!downloadUrl) {
        throw new Error('❌ Lỗi khi tải video lên MinIO');
      }

      console.log(`✅ Video đã tải lên MinIO thành công! URL: ${downloadUrl}`);

      // 🗑️ Xóa file video sau khi upload thành công
      this.deleteFile(outputFile);

      return { message: '✅ Quá trình quay và upload hoàn tất', downloadUrl };
    } catch (error) {
      console.error(`❌ Lỗi trong quá trình xử lý: ${error.message}`);

      // 🗑️ Nếu lỗi, xóa luôn file gốc nếu đã tạo
      if (outputFile) {
        this.deleteFile(outputFile);
      }

      throw new InternalServerErrorException(
        `❌ Lỗi khi xử lý video: ${error.message}`,
      );
    }
  }
}
