import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'minio';
import * as path from 'path';
import * as fs from 'fs';

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

  // Kiểm tra xem có kết nối được MinIO không
  private async testMinioConnection() {
    try {
      await this.minioClient.listBuckets();
      this.logger.log('✅ Kết nối MinIO thành công!');
    } catch (error) {
      this.logger.error(`❌ Không thể kết nối MinIO: ${error.stack}`);
    }
  }

  // Xóa file sau khi xử lý
  private deleteFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`🗑️ Đã xóa file: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`❌ Lỗi khi xóa file: ${error.message}`);
    }
  }

  // Upload file lên MinIO
  async uploadFile(
    objectName: string,
    filePath: string,
  ): Promise<string | null> {
    try {
      // Kiểm tra nếu file có tồn tại trước khi upload
      if (!fs.existsSync(filePath)) {
        throw new Error(`❌ File không tồn tại: ${filePath}`);
      }

      // Kiểm tra đường dẫn object để tránh lỗi lặp thư mục
      const fullObjectName = objectName.startsWith(this.pathDir)
        ? objectName
        : `${this.pathDir}/${objectName}`;

      console.log(
        `📝 Sẽ upload vào MinIO: Bucket = ${this.bucketName}, Path = ${fullObjectName}`,
      );

      await this.minioClient.fPutObject(
        this.bucketName,
        fullObjectName,
        filePath,
      );

      const fileUrl = `http://s3-dev.aurora-tech.com/${this.bucketName}/${fullObjectName}`;
      // const fileUrl = `http://${this.minioClient.host}:${this.minioClient.port}/${this.bucketName}/${fullObjectName}`;
      console.log(`✅ Upload thành công! File URL: ${fileUrl}`);

      // 🗑️ Xóa file sau khi upload thành công
      this.deleteFile(filePath);

      return fileUrl;
    } catch (error) {
      this.logger.error(`❌ Lỗi khi upload MinIO: ${error.message}`);
      // 🗑️ Xóa file sau khi upload thành công
      this.deleteFile(filePath);

      return null;
    }
  }
}
