import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { KSplatService } from './ksplat.service';

@ApiTags('ksplat')
@Controller('ksplat')
export class KSplatController {
  constructor(private readonly kSplatService: KSplatService) {}

  @Post('splat-to-ksplat')
  @ApiOperation({
    summary: 'Upload .ply hoặc .splat và chuyển đổi sang .ksplat',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File .ply hoặc .splat để chuyển đổi',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File .ksplat đã được chuyển đổi và tải lên MinIO',
    schema: {
      example: {
        message: 'Chuyển đổi thành công',
        downloadUrl: 'https://minio.example.com/ksplat/file.ksplat',
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const fileExt = extname(file.originalname).toLowerCase();
          if (!['.ply', '.splat'].includes(fileExt)) {
            return cb(
              new BadRequestException('Chỉ hỗ trợ tệp .ply hoặc .splat'),
              null,
            );
          }
          const fileName = `${Date.now()}-${file.originalname}`;
          cb(null, fileName);
        },
      }),
    }),
  )
  async uploadAndConvert(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không có tệp nào được tải lên.');
    }

    // Gọi service để xử lý file
    return this.kSplatService.processFile(file.path);
  }
}
