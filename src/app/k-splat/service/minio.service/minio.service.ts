import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'minio';
import * as fs from 'fs';
import { IMinioUploadFile } from './minio.type';
import {
  MINIO_URL,
  MINIO_PORT,
  MINIO_SSL,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MINIO_PATH_DIR,
} from 'src/config';

@Injectable()
export class MinIOService {
  private readonly logger = new Logger(MinIOService.name);
  private readonly minioClient: Client;
  private readonly bucketName: string;
  private readonly pathDir: string;

  constructor() {
    this.minioClient = new Client({
      endPoint: MINIO_URL || '',
      port: parseInt(MINIO_PORT) || 80,
      useSSL: MINIO_SSL === 'true',
      accessKey: MINIO_ACCESS_KEY || '',
      secretKey: MINIO_SECRET_KEY || '',
    });

    this.bucketName = MINIO_BUCKET || '3d-tour-outside';
    this.pathDir = MINIO_PATH_DIR || '3gs_service';

    this.testMinioConnection();
  }

  // Check if MinIO connection is successful
  private async testMinioConnection() {
    try {
      await this.minioClient.listBuckets();
      this.logger.log('✅ Successfully connected to MinIO!');
    } catch (error) {
      this.logger.error(`❌ Unable to connect to MinIO: ${error.stack}`);
    }
  }

  // Delete file after processing
  private deleteFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`🗑️ File deleted: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error deleting file: ${error.message}`);
    }
  }

  // Upload file to MinIO
  async uploadFile(params?: IMinioUploadFile): Promise<string | null> {
    const {
      objectName,
      filePath,
      pathDir = this.pathDir,
      bucketName = this.bucketName,
    } = params;

    try {
      // Check if the file exists before uploading
      if (!fs.existsSync(filePath)) {
        throw new Error(`❌ File does not exist: ${filePath}`);
      }

      // Ensure correct object path to avoid redundant directories
      const fullObjectName = objectName.startsWith(pathDir)
        ? objectName
        : `${pathDir}/${objectName}`;

      console.log(
        `📝 Uploading to MinIO: Bucket = ${bucketName}, Path = ${fullObjectName}`,
      );

      await this.minioClient.fPutObject(
        this.bucketName,
        fullObjectName,
        filePath,
      );

      const fileUrl = `https://${MINIO_URL}/${bucketName}/${fullObjectName}`;
      // const fileUrl = `https://${this.minioClient.host}:${this.minioClient.port}/${this.bucketName}/${fullObjectName}`;
      console.log(`✅ Upload successful! File URL: ${fileUrl}`);

      // 🗑️ Delete file after successful upload
      this.deleteFile(filePath);

      return fileUrl;
    } catch (error) {
      this.logger.error(`❌ Error uploading to MinIO: ${error.message}`);

      // 🗑️ Delete file after failed upload attempt
      this.deleteFile(filePath);

      return null;
    }
  }
}
