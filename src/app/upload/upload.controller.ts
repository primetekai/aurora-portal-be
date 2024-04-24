import {
  Bind,
  Controller,
  Get,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Param,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { FilesInterceptor } from '@nestjs/platform-express/multer/interceptors/files.interceptor';
import { ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { COMMON_SERVICE } from 'src/config';

@Controller(COMMON_SERVICE)
@ApiTags('upload')
export class UploadController {
  @Post('images')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile22(@UploadedFile() file) {
    console.log(file);
  }
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file) {
    console.log(file);
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files'))
  @Bind(UploadedFiles())
  uploadFiles(files) {
    console.log(files);
  }

  @Get('/:imgpath')
  seeUploadFile(@Param('imgpath') image, @Res() res): Promise<any> {
    console.log(image, { root: 'uploads' });
    return res.sendFile(image, { root: 'uploads' });
  }
}
