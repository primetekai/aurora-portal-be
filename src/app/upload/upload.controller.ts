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
  MAX_SIZE_OF_FILE_FILE,
  TYPE_IMAGE_FILE,
  TYPE_VIDEO_FILE,
  TYPE_FILE_FILE,
} from 'src/config';
import { Roles, RolesGuard, UserRole } from '../auth';
import { UploadService } from './upload.service';
import { UploadFileDto } from './dto';

@Controller(CBT_CDN)
@ApiTags('cbtcdn')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  private logger = new Logger('Upload Controller');

  @ApiBearerAuth()
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('upload')
  @ApiOperation({ summary: 'Upload a file (image, video, or document)' })
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
    description: 'Type of the file to upload (image, video, or file)',
    enum: ['image', 'video', 'file'],
    required: false,
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('fileName') fileName: string,
    @Query('fileType') fileType: 'image' | 'video' | 'file' = 'image',
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
      } else if (fileType === 'file') {
        if (file.size > Number(MAX_SIZE_OF_FILE_FILE))
          throw new HttpException(
            'File size is too large',
            HttpStatus.PAYLOAD_TOO_LARGE,
          );

        if (!TYPE_FILE_FILE.includes(file.mimetype))
          throw new HttpException(
            'Unsupported file type',
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
          );
      } else {
        throw new HttpException(
          'Invalid file type specified',
          HttpStatus.BAD_REQUEST,
        );
      }

      const url = await this.uploadService.uploadFile(file, fileName);

      return res.status(HttpStatus.CREATED).json(url);
    } catch (error) {
      if (error instanceof HttpException) {
        this.logger.error(`HttpException: ${error.message}`, error.stack);
        throw error;
      } else {
        this.logger.error(
          `Internal Server Error: ${error.message}`,
          error.stack,
        );
        throw new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @ApiOperation({ summary: 'Get asset' })
  @ApiResponse({ status: 200, description: 'Return asset.' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Get('/:fileName')
  async getSections(@Param('fileName') fileName: string, @Res() res) {
    try {
      const { content, mimeType } =
        await this.uploadService.getFileById(fileName);

      if (!content || !mimeType) {
        throw new NotFoundException('File not found');
      }

      res.setHeader('Content-Type', mimeType);

      res.status(HttpStatus.OK).send(content);
    } catch (e) {
      if (e instanceof NotFoundException) {
        this.logger.warn(`NotFoundException: ${e.message}`, e.stack);
        res.status(HttpStatus.NOT_FOUND).send(e.message);
      } else {
        this.logger.error(`Internal Server Error: ${e.message}`, e.stack);
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send('Internal Server Error');
      }
    }
  }
}
