import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { exec } from 'child_process';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';

@Injectable()
export class ConvertService {
  private readonly sectionFolder = './section/uploads'; // Thư mục lưu file sau khi convert

  constructor() {
    this.createSectionFolder();
  }

  private createSectionFolder() {
    if (!existsSync(this.sectionFolder)) {
      mkdirSync(this.sectionFolder, { recursive: true });
    }
  }

  private async runConversionCommand(
    inputFile: string,
    outputFile: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const command = `node node_modules/.bin/gaussian-splats-3d convert "${inputFile}" "${outputFile}" 1 5 "0,0,0" 5.0 256 0`;

      console.log(`🚀 Đang chạy lệnh: ${command}`);

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Lỗi convert: ${stderr}`);
          reject(new InternalServerErrorException(`Lỗi convert: ${stderr}`));
        } else {
          console.log(`✅ Chuyển đổi thành công: ${outputFile}`);
          resolve(outputFile);
        }
      });
    });
  }

  async convertToKsplat(inputFile: string): Promise<string> {
    if (!existsSync(inputFile)) {
      throw new InternalServerErrorException(
        `❌ File không tồn tại: ${inputFile}`,
      );
    }

    // Lấy đường dẫn file đầu ra (output)
    const outputFile = join(
      this.sectionFolder,
      inputFile
        .split('/')
        .pop()
        ?.replace(/\.(ply|splat)$/, '.ksplat') || 'output.ksplat',
    );

    // ✅ Đảm bảo thư mục chứa output tồn tại
    const outputDir = dirname(outputFile);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    try {
      // 🔥 Gọi script `create-ksplat.js` để chuyển đổi file
      const convertedFile = await this.runConversionCommand(
        inputFile,
        outputFile,
      );

      // 🗑️ Xóa file gốc sau khi convert
      unlinkSync(inputFile);

      return convertedFile;
    } catch (error) {
      throw new InternalServerErrorException(
        `❌ Lỗi khi chuyển đổi file: ${error.message}`,
      );
    }
  }
}
