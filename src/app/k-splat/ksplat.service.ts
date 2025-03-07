import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { ConvertService, MinIOService } from './service';

@Injectable()
export class KSplatService {
  constructor(
    private readonly convertService: ConvertService,
    private readonly minioService: MinIOService,
  ) {}

  // 🗑️ Function to delete files to prevent clutter
  private deleteFile(filePath: string) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ File deleted: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error deleting file: ${filePath} - ${error.message}`);
    }
  }

  async processFile(
    filePath: string,
  ): Promise<{ message: string; downloadUrl: string }> {
    let outputFile: string | null = null; // 🔹 Define outputFile beforehand

    try {
      // 1️⃣ Convert file to .ksplat
      outputFile = await this.convertService.convertToKsplat(filePath);

      // Extract file name from the path (works on both Windows and Linux)
      const fileName = path.basename(outputFile);

      if (!fileName) {
        throw new Error('Unable to determine file name.');
      }

      // 🗑️ Delete the original file after conversion
      this.deleteFile(filePath);

      // 2️⃣ Upload .ksplat file to MinIO
      const minioDir = process.env.MINIO_PATH_DIR || 'ksplat-files';
      const minioPath = `${minioDir}/${fileName}`;

      const downloadUrl = await this.minioService.uploadFile({
        objectName: minioPath,
        filePath: outputFile,
        pathDir: 'ksplat-files',
        bucketName: '3d-tour-outside',
      });

      if (!downloadUrl) {
        throw new Error('Error uploading to MinIO');
      }

      // 🗑️ Delete .ksplat file after successful upload
      this.deleteFile(outputFile);

      return { message: '✅ Conversion successful', downloadUrl };
    } catch (error) {
      console.error(`❌ File processing error: ${error.message}`);

      // 🗑️ If an error occurs, delete both the original file & .ksplat file (if exists)
      this.deleteFile(filePath);
      if (outputFile) {
        this.deleteFile(outputFile);
      }

      throw new InternalServerErrorException(
        `❌ File processing error: ${error.message}`,
      );
    }
  }
}
