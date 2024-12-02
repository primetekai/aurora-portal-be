import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { CBT_CDN, HOST_NAME, UPLOAD_FILE_PATH } from 'src/config';
import { checkAndRemoveFileNameExist } from './check-exist.until';
import { join } from 'path';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly basePath = UPLOAD_FILE_PATH;

  private readonly storagePath = join(this.basePath, 'common');

  constructor() {
    this.ensureStoragePathExists();
  }

  private async ensureStoragePathExists() {
    try {
      await fs.access(this.basePath);
    } catch {
      await fs.mkdir(this.basePath, { recursive: true });
    }

    try {
      await fs.access(this.storagePath);
    } catch {
      await fs.mkdir(this.storagePath, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    fileName?: string,
  ): Promise<string> {
    const uniqueFileName = checkAndRemoveFileNameExist(
      this.storagePath,
      file?.originalname,
      fileName,
    );

    const filePath = join(this.storagePath, uniqueFileName);

    await fs.writeFile(filePath, file?.buffer);

    return `http://${HOST_NAME}${CBT_CDN}/${uniqueFileName}`;
  }

  async getFileById(
    fileName: string,
  ): Promise<{ content: Buffer; mimeType: string }> {
    const filePath = join(this.storagePath, fileName);

    try {
      await fs.access(filePath);

      const mimeType = this.getMimeType(fileName);

      const content = await fs.readFile(filePath);

      return { content, mimeType };
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.mp4':
        return 'video/mp4';
      case '.avi':
        return 'video/avi';
      case '.mkv':
        return 'video/mkv';
      case '.pdf':
        return 'application/pdf';
      case '.doc':
      case '.docx':
        return 'application/msword';
      case '.zip':
        return 'application/zip';
      default:
        return 'application/octet-stream';
    }
  }
}
