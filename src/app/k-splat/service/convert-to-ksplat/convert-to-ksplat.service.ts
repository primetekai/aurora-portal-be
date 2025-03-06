import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PlyLoader, KSplatLoader } from '@mkkellogg/gaussian-splats-3d';

@Injectable()
export class ConvertService {
  private readonly sectionFolder = './section/uploads';

  constructor() {
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
      console.log(`🚀 Đang convert file: ${inputFile} ➝ ${outputFile}`);

      // ⚡ Load file PLY/SPLAT vào GaussianSplats3D
      const splatBuffer = await PlyLoader.loadFromURL(
        `file://${path.resolve(inputFile)}`,
        () => {}, // ✅ Fix lỗi: Truyền `onProgress` là một hàm trống
        false, // progressiveLoad = false
        undefined, // onProgressiveLoadSectionProgress (không cần)
        5, // splatAlphaRemovalThreshold
        1, // compressionLevel
        true, // optimizeSplatData
        0, // sphericalHarmonicsDegree
        {},
      );

      // 📝 Lưu file .ksplat
      await KSplatLoader.downloadFile(splatBuffer, outputFile);

      console.log(`✅ Chuyển đổi thành công: ${outputFile}`);

      // 🗑️ Xóa file gốc sau khi convert
      fs.unlinkSync(inputFile);

      return outputFile;
    } catch (error) {
      throw new InternalServerErrorException(
        `❌ Lỗi khi convert: ${error.message}`,
      );
    }
  }
}
