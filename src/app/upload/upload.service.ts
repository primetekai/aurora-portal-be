import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { CBT_CDN, HOST_NAME, UPLOAD_FILE_PATH } from 'src/config';
import { join } from 'path';
import { checkAndRemoveFileNameExist } from './check-exist.until';
import { getMimeType } from './get-mime-type.until';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  private readonly basePath = UPLOAD_FILE_PATH;
  private readonly storagePath = join(this.basePath, 'common');

  constructor() {
    this.ensureStoragePathExists();
  }

  private async ensureStoragePathExists() {
    try {
      await fs.access(this.basePath);
    } catch (error) {
      this.logger.warn(`Base path does not exist, creating: ${this.basePath}`);
      await fs.mkdir(this.basePath, { recursive: true });
    }

    try {
      await fs.access(this.storagePath);
    } catch (error) {
      this.logger.warn(
        `Storage path does not exist, creating: ${this.storagePath}`,
      );
      await fs.mkdir(this.storagePath, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    fileName?: string,
  ): Promise<string> {
    if (!file?.buffer) {
      throw new NotFoundException('File buffer is missing or empty');
    }

    const uniqueFileName = checkAndRemoveFileNameExist(
      this.storagePath,
      file?.originalname,
      fileName,
    );

    const filePath = join(this.storagePath, uniqueFileName);

    try {
      await fs.writeFile(filePath, file?.buffer);
    } catch (error) {
      this.logger.error(`Error writing file: ${filePath}`, error);
      throw new Error('Could not save the file');
    }

    const fileUrl = `https://${HOST_NAME}${CBT_CDN}/${uniqueFileName}`;

    this.logger.log(`File uploaded successfully: ${fileUrl}`);
    return fileUrl;
  }

  async getFileById(
    fileName: string,
  ): Promise<{ content: Buffer; mimeType: string }> {
    const filePath = join(this.storagePath, fileName);

    try {
      await fs.access(filePath);
    } catch (error) {
      this.logger.error(`File not found: ${filePath}`);
      throw new NotFoundException('File not found');
    }

    const mimeType = getMimeType(fileName);

    try {
      const content = await fs.readFile(filePath);
      return { content, mimeType };
    } catch (error) {
      this.logger.error(`Error reading file: ${filePath}`, error);
      throw new Error('Could not read the file');
    }
  }
}
