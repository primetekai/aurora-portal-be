import { Injectable } from '@nestjs/common';
import {
  captureGoogleEarth,
  crawlSnapShotScreenWebService,
  IVideoMetadata,
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
  ): Promise<string | null> {
    let outputFile: IVideoMetadata | null = null;
    const MIN_VIDEO_SIZE_MB = 1;
    const MAX_RETRIES = 2;

    console.log(
      `🌍 Starting Google Earth video capture at location: ${location}`,
    );

    try {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          outputFile = await captureGoogleEarth(location, zoom);

          // Check video size
          if (outputFile?.size?.megabytes < MIN_VIDEO_SIZE_MB) {
            console.warn(
              `⚠️ Attempt ${attempt}: Video size too small (${outputFile.size.megabytes}MB < ${MIN_VIDEO_SIZE_MB}MB)`,
            );

            if (attempt < MAX_RETRIES) {
              console.log(`🔄 Retrying capture...`);
              this.deleteFile(outputFile.videoPath);
              continue;
            } else {
              console.error(
                '❌ Failed to capture video of sufficient size after all attempts',
              );
              return null;
            }
          }

          console.log(`✅ Video captured successfully:`, {
            path: outputFile.videoPath,
            size: `${outputFile.size.megabytes}MB`,
            duration: `${outputFile.duration}s`,
            frames: outputFile.frameCount,
          });

          const fileNameVideoPath = path.basename(outputFile.videoPath);

          const minioDir = process.env.MINIO_PATH_DIR || '3d-video-360';

          const minioPath = `${minioDir}/${fileNameVideoPath}`;

          console.log(`📤 Uploading video to MinIO at: ${minioPath}`);

          const videoUrl = await this.minioService.uploadFile({
            objectName: minioPath,
            filePath: outputFile.videoPath,
            pathDir: minioDir,
            bucketName: '3d-tour-outside',
          });

          if (!videoUrl) {
            console.error('❌ MinIO upload failed');
            return null;
          }

          return videoUrl;
        } catch (captureError) {
          if (attempt === MAX_RETRIES) {
            console.error(
              `❌ All capture attempts failed: ${captureError.message}`,
            );
            return null;
          }
          console.warn(`⚠️ Attempt ${attempt} failed, retrying...`);
        }
      }

      return null;
    } catch (error) {
      console.error(`❌ Error during processing: ${error.message}`);
      return null;
    } finally {
      if (outputFile?.videoPath && !outputFile?.videoPath) {
        this.deleteFile(outputFile.videoPath);
      }
    }
  }
}
