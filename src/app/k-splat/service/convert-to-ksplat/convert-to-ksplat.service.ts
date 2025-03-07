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
        `❌ File does not exist: ${inputFile}`,
      );
    }

    // 📝 Output file path
    const outputFile = path.join(
      this.sectionFolder,
      path.basename(inputFile).replace(/\.(ply|splat)$/, '.ksplat'),
    );

    try {
      console.log(`🚀 Converting file: ${inputFile} ➝ ${outputFile}`);

      // ✅ Call CreateKSplatService to convert the file
      await this.createKSplatService.convertToKSplat(inputFile, outputFile);

      console.log(`✅ Conversion successful: ${outputFile}`);

      // 🗑️ Delete the original file after conversion
      fs.unlinkSync(inputFile);

      return outputFile;
    } catch (error) {
      console.error(`❌ Conversion error: ${error.message}`);
      throw new InternalServerErrorException(
        `Error during file conversion: ${error.message}`,
      );
    }
  }
}
