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

  // 🗑️ Hàm xóa file để tránh rác
  private deleteFile(filePath: string) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Đã xóa file: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Lỗi khi xóa file: ${filePath} - ${error.message}`);
    }
  }

  async processFile(
    filePath: string,
  ): Promise<{ message: string; downloadUrl: string }> {
    let outputFile: string | null = null; // 🔹 Định nghĩa outputFile trước

    try {
      // 1️⃣ Convert file sang .ksplat
      outputFile = await this.convertService.convertToKsplat(filePath);

      // Lấy tên file từ đường dẫn (Windows + Linux đều chạy đúng)
      const fileName = path.basename(outputFile);

      if (!fileName) {
        throw new Error('Không thể xác định tên file.');
      }

      // 🗑️ Xóa file gốc sau khi convert
      this.deleteFile(filePath);

      // 2️⃣ Upload file .ksplat lên MinIO
      const minioDir = process.env.MINIO_PATH_DIR || '3gs_service';
      const minioPath = `${minioDir}/${fileName}`;
      const downloadUrl = await this.minioService.uploadFile(
        minioPath,
        outputFile,
      );

      if (!downloadUrl) {
        throw new Error('Lỗi khi tải lên MinIO');
      }

      // 🗑️ Xóa file .ksplat sau khi upload thành công
      this.deleteFile(outputFile);

      return { message: '✅ Chuyển đổi thành công', downloadUrl };
    } catch (error) {
      console.error(`❌ Lỗi xử lý file: ${error.message}`);

      // 🗑️ Nếu lỗi, xóa luôn cả file gốc & file .ksplat (nếu có)
      this.deleteFile(filePath);
      if (outputFile) {
        this.deleteFile(outputFile);
      }

      throw new InternalServerErrorException(
        `❌ Lỗi xử lý file: ${error.message}`,
      );
    }
  }
}
