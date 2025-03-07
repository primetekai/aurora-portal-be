import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'minio';
import * as fs from 'fs';
import { IMinioUploadFile } from './minio.type';

@Injectable()
export class MinIOService {
  private readonly logger = new Logger(MinIOService.name);
  private readonly minioClient: Client;
  private readonly bucketName: string;
  private readonly pathDir: string;

  constructor() {
    this.minioClient = new Client({
      endPoint: 's3-dev.aurora-tech.com',
      port: 443,
      useSSL: true,
      accessKey: 'lstlJnqwAcr9lqNe4B3O',
      secretKey: 'H440qEqcXqMZq2X9SU4bJriZODF5lMZm10hcoDih',
      // endPoint: process.env.MINIO_URL || 's3-dev.aurora-tech.com',
      // port: parseInt(process.env.MINIO_PORT) || 80,
      // useSSL: process.env.MINIO_SSL === 'true',
      // accessKey: process.env.MINIO_ACCESS_KEY || 'lstlJnqwAcr9lqNe4B3O',
      // secretKey:
      //   process.env.MINIO_SECRET_KEY ||
      //   'H440qEqcXqMZq2X9SU4bJriZODF5lMZm10hcoDih',
    });

    this.bucketName = process.env.MINIO_BUCKET || '3d-tour-outside';
    this.pathDir = process.env.MINIO_PATH_DIR || '3gs_service';

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

      const fileUrl = `http://s3-dev.aurora-tech.com/${bucketName}/${fullObjectName}`;
      // const fileUrl = `http://${this.minioClient.host}:${this.minioClient.port}/${this.bucketName}/${fullObjectName}`;
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
