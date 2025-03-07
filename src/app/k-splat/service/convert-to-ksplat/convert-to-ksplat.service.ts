import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CreateKSplatService } from '../create-ksplat.service';

@Injectable()
export class ConvertService {
  private readonly sectionFolder = './section/uploads';

  constructor(private readonly createKSplatService: CreateKSplatService) {
    this.createSectionFolder();
  }

  private createSectionFolder() {
    if (!fs.existsSync(this.sectionFolder)) {
      fs.mkdirSync(this.sectionFolder, { recursive: true });
    }
  }

  async convertToKsplat(inputFile: string): Promise<string> {
    if (!fs.existsSync(inputFile)) {
      throw new InternalServerErrorException(
        `❌ File không tồn tại: ${inputFile}`,
      );
    }

    // 📝 Đường dẫn file đầu ra
    const outputFile = path.join(
      this.sectionFolder,
      path.basename(inputFile).replace(/\.(ply|splat)$/, '.ksplat'),
    );

    try {
      console.log(`🚀 Đang chuyển đổi file: ${inputFile} ➝ ${outputFile}`);

      // ✅ Gọi CreateKSplatService để chuyển đổi file
      await this.createKSplatService.convertToKSplat(inputFile, outputFile);

      console.log(`✅ Chuyển đổi thành công: ${outputFile}`);

      // 🗑️ Xóa file gốc sau khi convert
      fs.unlinkSync(inputFile);

      return outputFile;
    } catch (error) {
      console.error(`❌ Lỗi khi chuyển đổi: ${error.message}`);
      throw new InternalServerErrorException(
        `Lỗi khi chuyển đổi file: ${error.message}`,
      );
    }
  }
}
