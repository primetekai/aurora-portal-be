import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiConsumes,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  COMMON_SERVICE,
  MAX_SIZE_OF_IMAGE_FILE,
  TYPE_IMAGE_FILE,
} from 'src/config';
import { AzureStorageService } from './azure-storage.service';
import { UploadFileDto } from './dto';
import { AuthGuard } from '@nestjs/passport';

@Controller(COMMON_SERVICE)
@ApiTags('upload')
@ApiBearerAuth()
@UseGuards(AuthGuard())
export class FilesController {
  constructor(private readonly azureStorageService: AzureStorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadFileDto,
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Res() res) {
    try {
      if (!file)
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);

      if (file.size > Number(MAX_SIZE_OF_IMAGE_FILE))
        throw new HttpException('Payload Too Large', 413);

      if (!TYPE_IMAGE_FILE.includes(file.mimetype))
        throw new HttpException(
          'Unsupported Media Type',
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );

      const containerName = 'public';
      const fileName = file.originalname;
      const fileContent = file.buffer;
      const url = await this.azureStorageService.uploadFile(
        containerName,
        fileName,
        fileContent,
      );
      return res.status(HttpStatus.OK).json(url);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
