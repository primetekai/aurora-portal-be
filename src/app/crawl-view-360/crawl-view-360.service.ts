import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { captureGoogleEarth, crawlSnapShotScreenWebService } from './service';
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

  async crawlCaptureGoogleEarth(location: string): Promise<any> {
    let outputFile: string | null = null;

    console.log(
      `🌍 Starting Google Earth video capture at location: ${location}`,
    );

    try {
      // 1️⃣ Capture Google Earth video
      outputFile = await captureGoogleEarth(location);
      console.log(`📽️ Video created: ${outputFile}`);

      // Extract file name from path (compatible with both Windows and Linux)
      const fileName = path.basename(outputFile);

      if (!fileName) {
        throw new Error('Unable to determine video file name.');
      }

      console.log(`📂 Video file name: ${fileName}`);

      // 2️⃣ Upload file to MinIO
      const minioDir = process.env.MINIO_PATH_DIR || '33d-video-360';

      const minioPath = `${minioDir}/${fileName}`;

      console.log(`📤 Uploading video to MinIO at: ${minioPath}`);

      const downloadUrl = await this.minioService.uploadFile({
        objectName: minioPath,
        filePath: outputFile,
        pathDir: minioDir,
        bucketName: '3d-tour-outside',
      });

      if (!downloadUrl) {
        throw new Error('❌ Error uploading video to MinIO');
      }

      console.log(
        `✅ Video successfully uploaded to MinIO! URL: ${downloadUrl}`,
      );

      this.deleteFile(outputFile);

      return {
        message: '✅ Capture and upload process completed successfully',
        downloadUrl,
      };
    } catch (error) {
      console.error(`❌ Error during processing: ${error.message}`);

      if (outputFile) {
        this.deleteFile(outputFile);
      }

      throw new InternalServerErrorException(
        `❌ Error processing video: ${error.message}`,
      );
    }
  }
}
