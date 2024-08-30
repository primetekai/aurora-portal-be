import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CBT_CDN,
  MAX_SIZE_OF_IMAGE_FILE,
  MAX_SIZE_OF_VIDEO_FILE,
  TYPE_IMAGE_FILE,
  TYPE_VIDEO_FILE,
} from 'src/config';
import { Roles, RolesGuard, UserRole } from '../auth';
import { UploadService } from './upload.service';
import { UploadFileDto } from './dto';

@Controller(CBT_CDN)
@ApiTags('cbtcdn')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  private logger = new Logger('Asset Controller');

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('upload')
  @ApiOperation({ summary: 'Upload a file (image or video)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadFileDto,
  })
  @ApiQuery({
    name: 'fileName',
    type: String,
    description: 'File Name',
    required: false,
  })
  @ApiQuery({
    name: 'fileType',
    type: String,
    description: 'Type of the file to upload (image or video)',
    enum: ['image', 'video'],
    required: false,
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('fileName') fileName: string,
    @Query('fileType') fileType: 'image' | 'video' = 'image',
    @Res() res,
  ) {
    try {
      if (!file)
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);

      if (fileType === 'image') {
        if (file.size > Number(MAX_SIZE_OF_IMAGE_FILE))
          throw new HttpException(
            'Image file size is too large',
            HttpStatus.PAYLOAD_TOO_LARGE,
          );

        if (!TYPE_IMAGE_FILE.includes(file.mimetype))
          throw new HttpException(
            'Unsupported image type',
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
          );
      } else if (fileType === 'video') {
        if (file.size > Number(MAX_SIZE_OF_VIDEO_FILE))
          throw new HttpException(
            'Video file size is too large',
            HttpStatus.PAYLOAD_TOO_LARGE,
          );

        if (!TYPE_VIDEO_FILE.includes(file.mimetype))
          throw new HttpException(
            'Unsupported video type',
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
          );
      } else {
        throw new HttpException(
          'Invalid file type specified',
          HttpStatus.BAD_REQUEST,
        );
      }

      const url = await this.uploadService.uploadFile(file, fileName);

      return res.status(HttpStatus.OK).json(url);
    } catch (error) {
      if (error instanceof HttpException) {
        this.logger.error(`HttpException`, error.stack);

        throw error;
      } else {
        this.logger.error(`Internal Server Error"`, error.stack);

        throw new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @ApiOperation({ summary: 'Get asset' })
  @ApiResponse({ status: 200, description: 'Return asset.' })
  @Get('/:fileName')
  async getSections(@Param('fileName') fileName: string, @Res() res) {
    try {
      const { content, mimeType } =
        await this.uploadService.getFileById(fileName);

      if (!content || !mimeType) {
        throw new NotFoundException('File not found');
      }

      res.setHeader('Content-Type', mimeType);

      res.send(content);
    } catch (e) {
      return e;
    }
  }
}
