import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  captureGoogleEarth,
  crawlSnapShotScreenWebService,
  ICaptureGoogleEarth,
} from './service';
import { MinIOService } from '../k-splat/service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CrawlService {
  constructor(private readonly minioService: MinIOService) {}

  async crawlSnapShotScreenWeb(phoneNumber, source): Promise<any> {
    return crawlSnapShotScreenWebService(phoneNumber, source);
  }

  // 🗑️ Function to delete temporary files to avoid clutter
  private deleteFile(filePath: string) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Temporary file deleted: ${filePath}`);
      }
    } catch (error) {
      console.error(
        `⚠️ Error deleting temporary file: ${filePath} - ${error.message}`,
      );
    }
  }

  async crawlCaptureGoogleEarth(
    location: string,
    zoom?: number,
  ): Promise<string> {
    let outputFile: string | null = null;

    console.log(
      `🌍 Starting Google Earth video capture at location: ${location}`,
    );

    try {
      // 1️⃣ Capture Google Earth video
      outputFile = await captureGoogleEarth(location, zoom);
      console.log(`📽️ Video created: ${outputFile}`);

      // Extract file name from path (compatible with both Windows and Linux)
      const fileNameVideoPath = path.basename(outputFile);

      if (!fileNameVideoPath) {
        throw new Error('Unable to determine video file name.');
      }

      console.log(`📂 Video file name: ${fileNameVideoPath}`);

      // Ensure files exist before uploading
      if (!fs.existsSync(outputFile)) {
        throw new Error(`File does not exist: ${outputFile}`);
      }

      // 2️⃣ Upload file to MinIO
      const minioDir = process.env.MINIO_PATH_DIR || '3d-video-360';

      const minioPath = `${minioDir}/${fileNameVideoPath}`;

      console.log(`📤 Uploading video to MinIO at: ${minioPath}`);

      const videoUrl = await this.minioService.uploadFile({
        objectName: minioPath,
        filePath: outputFile,
        pathDir: minioDir,
        bucketName: '3d-tour-outside',
      });

      if (!videoUrl) {
        throw new Error('❌ Error uploading video to MinIO');
      }

      console.log(`✅ Video successfully uploaded to MinIO! URL: ${videoUrl}`);

      return videoUrl;
    } catch (error) {
      console.error(`❌ Error during processing: ${error.message}`);

      throw new InternalServerErrorException(
        `❌ Error processing video: ${error.message}`,
      );
    }
  }
}
